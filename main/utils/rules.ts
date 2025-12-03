import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { IRule } from '../../renderer/type/rules'

export class RuleManager {
    private rules: IRule[] = []
    private static instance: RuleManager
    private ruleConfigDir = ''
    public static getInstance(): RuleManager {
        if (!RuleManager.instance) {
            RuleManager.instance = new RuleManager()
        }
        return RuleManager.instance
    }
    private constructor() {
        const userDataPath = app.getPath('userData')
        this.ruleConfigDir = path.join(userDataPath, 'config')

        if (!fs.existsSync(this.ruleConfigDir)) {
            fs.mkdirSync(this.ruleConfigDir, { recursive: true })
        }
    }
    private saveRule() {
        const ruleConfigPath = path.join(this.ruleConfigDir, 'rules.json')
        fs.writeFileSync(ruleConfigPath, JSON.stringify(this.rules, null, 2))
    }
    public loadRules() {
        const ruleConfigPath = path.join(this.ruleConfigDir, 'rules.json')
        if (fs.existsSync(ruleConfigPath)) {
            const data = fs.readFileSync(ruleConfigPath, 'utf8')
            this.rules = JSON.parse(data)
        }
        return this.rules
    }
    public addRule(rule: IRule) {
        this.rules.push(rule)
        this.saveRule()
    }
    public deleteRule(ruleId:string) {
        this.rules = this.rules.filter(r => r.id !== ruleId)
        this.saveRule()
    }
}

export default RuleManager.getInstance()