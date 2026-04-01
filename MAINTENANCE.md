# 网站维护与更新指南

以下为建议的常规维护与更新步骤（简洁版），可直接作为复查清单：

## 每日 / 每次发布前
- 更新文章或页面后，先在本地运行：
  ```bash
  pnpm install
  pnpm run dev
  ```
- 检查页面渲染、图片、代码块和外部资源是否正常。

## 提交与部署流程
- 编辑完成后：
  ```bash
  git add .
  git commit -m "docs: 更新内容说明"
  git push origin main
  ```
- Vercel 会在 push 后自动触发构建与部署；可登录 Vercel 仪表板查看构建日志。

## 每周
- 更新依赖：`pnpm up --latest`（先在分支上测试）
- 运行本地构建测试：`pnpm run build`，确保无构建错误。
- 检查 RSS/Atom、订阅源是否正常（访问 `/atom.xml`）。

## 每月
- 备份 `content/` 与 `public/` 静态资源到独立仓库或云存储。
- 检查图片外链（若使用第三方图床），迁移到托管仓库或 CDN 以提高稳定性。

## 安全与域名
- 定期检查 GitHub 仓库权限与分支保护规则。
- 若使用自定义域名，检查证书有效期与 DNS 配置。

## 故障排查要点
- 若图片无法显示：打开 DevTools → Network，查看图片请求 URL 与状态码；优先将关键头像/封面放入 `public/images/`。
- 若构建失败：查看 Vercel 构建日志，复制错误信息到本地复现。

## 建议的文件/目录清单
- 文章内容：`content/posts/`
- 配置文件：`blog.config.ts`、`nuxt.config.ts`
- 侧边栏/小组件：`app/components/widget/`
- 静态资源：`public/images/`

---

需要我把这份 `MAINTENANCE.md` 提交到仓库并推送吗？我可以一并提交并触发部署。 
