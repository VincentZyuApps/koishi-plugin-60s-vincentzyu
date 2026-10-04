import { vi } from 'vitest'

export interface CommandRegistration {
  declaration: string
  primary: string
  description: string
  aliases: string[]
  options: Array<[string, string]>
  action?: Function
  subcommands: CommandRegistration[]
  /** 所在父命令的 declaration（subcommand 才有） */
  parent?: string
}

/** 模拟 ctx.command 链，收集所有命令注册信息 */
export function mockCommandContext(extraLogger: any = {}) {
  const registrations: CommandRegistration[] = []

  function createChain(reg: CommandRegistration, parentChain?: any) {
    const chain: any = {
      alias: vi.fn((...names: string[]) => {
        reg.aliases.push(...names)
        return chain
      }),
      option: vi.fn((name: string, syntax: string) => {
        reg.options.push([name, syntax])
        return chain
      }),
      action: vi.fn((handler: Function) => {
        reg.action = handler
        return chain
      }),
      subcommand: vi.fn((declaration: string, description?: string) => {
        const sub: CommandRegistration = {
          declaration,
          primary: declaration.split(' ')[0],
          description: description ?? '',
          aliases: [],
          options: [],
          subcommands: [],
          parent: reg.declaration,
        }
        reg.subcommands.push(sub)
        const subChain = createChain(sub, chain)
        chain._subs = chain._subs || []
        chain._subs.push(subChain)
        return subChain
      }),
    }
    return chain
  }

  const ctx: any = {
    logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn(), ...extraLogger },
    command: vi.fn((declaration: string, description?: string) => {
      const reg: CommandRegistration = {
        declaration,
        primary: declaration.split(' ')[0],
        description: description ?? '',
        aliases: [],
        options: [],
        subcommands: [],
      }
      registrations.push(reg)
      return createChain(reg)
    }),
    bots: [],
    on: vi.fn(),
    inject: vi.fn(),
  }

  return { ctx, registrations }
}

/** 从收集结果里找指定 primary 命令的注册信息 */
export function findRegistration(regs: CommandRegistration[], primary: string): CommandRegistration | undefined {
  return regs.find((r) => r.primary === primary)
}
