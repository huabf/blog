# 🚀 博客部署清单

**最后更新**: 2026-04-01 | **状态**: 进行中

## ✅ 已完成的工作

- [x] 修改博客配置 (`blog.config.ts`)
  - 博客标题: `mushroom growing`
  - 作者: `mushroom`
  - GitHub: `https://github.com/huabf`
- [x] 删除示例文章
- [x] 清空示例友链
- [x] Git 初始化与配置
- [x] 本地配置提交

---

## 📝 需要你操作的步骤

### 【第一步】创建 GitHub 仓库 ⏱️ 5分钟

1. 访问 [github.com/new](https://github.com/new)
2. 填写仓库信息：
   - Repository name: `blog`
   - Description: `HELLO-:>`
   - Public 权限（允许他人浏览）
3. 点击 "Create repository"

### 【第二步】推送代码到 GitHub ⏱️ 3分钟

在项目目录运行：
```powershell
cd d:\blog\blog-v3-main
git branch -M main
git push -u origin main
```

### 【第三步】连接 Vercel 部署 ⏱️ 10分钟

1. 访问 [vercel.com](https://vercel.com)
2. 用 GitHub 账号登录
3. 点击 "Add New" → "Project"
4. 选择 `huabf/blog` 仓库
5. 点击 "Import"
6. **配置构建设置**：
   - Build Command: `pnpm run build`
   - Output Directory: `.output/public`
   - Install Command: `pnpm install`
7. 点击 "Deploy"
8. 等待部署完成（通常 3-5 分钟）

> ✨ 完成后，Vercel 会分配一个免费域名，你可以通过它访问博客

### 【第四步】Cloudflare R2 图床配置 ⏱️ 15分钟

#### 创建存储桶

1. 登录 [Cloudflare 仪表板](https://dash.cloudflare.com/)
2. 左侧菜单 → **R2** → **创建存储桶**
3. 填写信息：
   - 存储桶名称: `blog-images`
   - 地区: `自动选择`
4. 创建完成后，点击存储桶获取公开 URL（格式: `https://your-bucket.r2.cloudflairstatic.com/`）

#### 获取 API Token

1. 右上角 → 账户 → **我的配置文件** → **API 令牌**
2. 创建令牌：
   - 权限: 选择 `R2` 权限
   - 应用资源: 选择你的 `blog-images` 存储桶
3. 复制并保存 **Access Key ID** 和 **Secret Access Key**

#### 上传图片

选择以下方式之一：
- **网页工具** (推荐简便用户): [R2 Web UX](https://r2.devtool.tech/)
  - 填入 Access Key、Secret Key、存储桶名称
  - 直接拖拽上传图片
- **命令行工具**: 使用 [`wrangler` CLI](https://developers.cloudflare.com/workers/wrangler/)

#### 在文章中使用

在文章中引用图片：
```markdown
![图片描述](https://your-bucket.r2.cloudflairstatic.com/image-name.jpg)
```

---

## 🎨 后续美化与优化建议

### 基础配置优化

- [ ] **修改 favicon** (`blog.config.ts` 中的 `favicon`)
  - 推荐工具: [Favicon Generator](https://www.favicon-generator.org/)
  - 上传到 CF R2 并更新链接

- [ ] **上传个人头像** 
  - 位置: `blog.config.ts` 中的 `author.avatar`
  - 上传到 CF R2 或其他图床

- [ ] **更新博客域名**
  - 修改 `blog.config.ts` 中的 `url` 字段
  - 加入自己的域名 (如 `https://blog.yourdomain.com/`)

- [ ] **配置评论系统** (可选)
  - 选项 1: [Twikoo](https://twikoo.js.org/) - 国内友好
  - 选项 2: [Artalk](https://artalk.js.org/) - 自部署
  - 在 `blog.config.ts` 填入配置

### 内容建设

- [ ] **创建第一篇文章**
  ```bash
  pnpm run new
  ```
  - 按提示填入文章信息后自动生成模板
  - 编辑 `content/posts/YYYY/your-article.md`

- [ ] **观看主题文档**
  - 查看 [项目 README](./README.md) 了解功能特性
  - 学习 Markdown 扩展语法（代码高亮、组件等）

- [ ] **填充链接页面** 
  - 编辑 `content/link.md`
  - 后续有友链申请时，在 `app/feeds.ts` 中添加
  
  格式示例：
  ```typescript
  {
    author: '友链名字',
    sitenick: '昵称',
    title: '博客标题',
    desc: '博客描述',
    link: 'https://example.com',
    feed: 'https://example.com/atom.xml',
    icon: 'https://example.com/favicon.ico',
    avatar: 'https://example.com/avatar.jpg',
    archs: ['Nuxt', 'Vercel'],
    date: '2026-04-01',
    comment: '备注信息',
  },
  ```

### 博客美化技巧

- [ ] **自定义主题色** (`app/assets/css/_variable.scss`)
- [ ] **添加分析统计** (推荐 Umami)
- [ ] **CDN 加速** (国内推荐 EdgeOne 或阿里云 CDN)
- [ ] **SEO 优化**
  - 在文章 Front Matter 中添加 `description` 和 `image`
  - 完善 `blog.config.ts` 中的元数据

### 定期维护

- [ ] **每月检查友链** (app/feeds.ts)
  - 验证友链是否仍在线
  - 移除失效链接

- [ ] **更新依赖**
  ```bash
  pnpm run bump
  ```

- [ ] **性能监测**
  - 使用 Vercel 自带的分析工具
  - 定期检查 Lighthouse 评分

---

## 🆘 常见问题

### Q: Vercel 构建失败怎么办？
**A:** 检查以下几点：
1. 本地 `pnpm install && pnpm run build` 是否能成功
2. 确保 Node.js 版本符合 (22.18+ / 23.6+ / 24+)
3. 检查 Vercel 项目设置中的环境变量是否完整
4. 查看 Vercel 的构建日志寻找具体错误

### Q: 如何修改博客名字？
**A:** 编辑 `blog.config.ts` 中的以下字段：
```typescript
title: '你的新博客名',
subtitle: '副标题',
description: '博客描述',
```
然后 `git push` 会自动触发重新部署

### Q: 怎么添加新分类？
**A:** 编辑 `blog.config.ts` 中的 `article.categories`，格式参考已有分类

### Q: Cloudflare 图床如何实现私有防盗链？
**A:** 在 R2 存储桶设置中配置 CORS 和访问规则，建议咨询 CF 官方文档

---

## 📚 有用的资源

- **Nuxt.js 官方**: https://nuxt.com
- **Nuxt Content 文档**: https://content.nuxt.com
- **Vercel 文档**: https://vercel.com/docs
- **Cloudflare 文档**: https://developers.cloudflare.com
- **项目主题作者博客**: https://blog.zhilu.site

---

## 🎯 下一步行动

**建议优先顺序:**
1. ✍️ 完成第一至四步 (部署上线)
2. 🖼️ 上传个人头像和 favicon
3. ✍️ 写第一篇测试文章
4. 🎨 根据需求进行美化和优化

**部署到上线预计**: 30-60 分钟

---

**记录你的进度:** 遇到问题了吗？创建一个 GitHub Issue 或查看主题官方文档
