export class  ToyVue {
      constructor(config) {
            this.template = document.querySelector(config.el)
            this.data = reactive(config.data)

            for (let name in config.methods) {
                  this[name] = () => {
                    config.methods[name].apply(this.data);
                  }
            }

            this.traversal(this.template)
      }

      traversal(node) {
            if(node.nodeType ===  Node.TEXT_NODE) {
                  if(node.textContent.trim().match(/^{{([\s\S]+)}}$/)) {
                        let name = RegExp.$1
                        console.log(name)
                        effect(() => node.textContent = this.data[name])
                  }
            }
            if(node.nodeType === Node.ELEMENT_NODE) {
                  let attributes = node.attributes
                  for (const attribute of attributes) {
                        console.log(attribute)
                        if(attribute.name === 'v-model') {
                              console.log(attribute.value)
                              const name = attribute.value
                              effect(() => node.value = this.data[name])
                              node.addEventListener("input", event => this.data[name] = node.value)
                        }
                        if(attribute.name.match(/^v-bind:([\s\S]+)$/)) {
                              let attributeName = RegExp.$1
                              let name = attribute.value
                              effect(() => node.setAttribute(attributeName,this.data[name]))
                        }
                        if(attribute.name.match(/^v-on:([\s\S]+)$/)) {
                              let eventName = RegExp.$1
                              let fnname = attribute.value
                              node.addEventListener(eventName,this[fnname])
                        }
                  }
            }
            if (node.childNodes && node.childNodes.length) {
                  for (const child of node.childNodes) {
                        this.traversal(child)
                  }
            }
      }        
}

let effects = new Map()

let currentEffect = null
function  effect(fn) {
      currentEffect = fn
      fn()
      currentEffect = null
}

function reactive(object) {
      let observd = new Proxy(object, {
            get(object, property) {
               if(currentEffect) {
                  if(!effects.has(object)){
                        effects.set(object, new Map())
                  }
                  if (!effects.get(object).get(property)) {
                        effects.get(object).set(property, new Array())
                  }
                  effects.get(object).get(property).push(currentEffect)
               }

               return object[property]
            },
            set(object,property,value) {
                object[property] = value

                if (effects.has(object) && effects.get(object).has(property)) {
                  for (const effect of effects.get(object).get(property)) {
                        effect()
                  }
                }
                return true
            }
      })
      return observd
}

// let dummy 
// let counter = reactive({num:1})

// effect(() => (dummy = counter.num))

// let dummy2 
// let counter2 = reactive({num:0})

// effect(() => (dummy2 = counter2.num))

// // console.log(dummy)

// counter.num = 7

// // console.log(dummy)