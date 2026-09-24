/**
 * 登录相关请求统一走 `entities/user`（决策 D8：token 归 user 实体）。
 * 此处仅做转发，避免 features 内再写一份接口定义。
 */
export { login, fetchUserInfo } from '@/entities/user'
