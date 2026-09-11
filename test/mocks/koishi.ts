function element(type: string, attrs?: unknown, children?: unknown) {
  if (Array.isArray(attrs) && children === undefined) {
    children = attrs
    attrs = {}
  }
  const attrsObj = attrs ?? {}
  return {
    type,
    attrs: attrsObj,
    children: children === undefined ? [] : Array.isArray(children) ? children : [children],
    toString() {
      if (type === 'text') return (attrsObj as any).content ?? ''
      const attrStr = Object.entries(attrsObj as any)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => ` ${k}="${v}"`)
        .join('')
      const inner = (this.children as any[])?.map((c) => (typeof c === 'string' ? c : c?.toString?.() ?? '')).join('') ?? ''
      return `<${type}${attrStr}>${inner}</${type}>`
    },
  }
}

export const h = Object.assign(element, {
  text: (content: string) => element('text', { content }),
  image: (data: unknown, mime?: string) => element('image', { data, ...(mime ? { mime } : {}) }),
  quote: (id: string) => element('quote', { id }),
  normalize: (source: unknown) => {
    if (typeof source === 'string') return [element('text', { content: source })]
    if (Array.isArray(source)) return source
    return source == null ? [] : [source]
  },
  escape: (text: string) => text,
  unescape: (text: string) => text,
})

const schemaChain: any = new Proxy(function schema() {}, {
  get: () => (..._args: unknown[]) => schemaChain,
  apply: () => schemaChain,
})

export const Schema: any = new Proxy({}, {
  get: () => (..._args: unknown[]) => schemaChain,
})

export class Context {
  logger: { debug: (...a: any[]) => void; info: (...a: any[]) => void; warn: (...a: any[]) => void; error: (...a: any[]) => void } = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  }
}
