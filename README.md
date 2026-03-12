# Smart Wardrobe

中文 | [English](#english)

个人数字衣橱与穿搭日历系统。当前版本已经支持真实衣橱管理、OOTD 日历、搜索筛选、分析看板、Excel 导入和图片 ZIP 批量匹配导入。

## 中文

### 当前功能

- 衣橱管理
  - 新增、编辑、查看衣物
  - 列表 / 卡片视图
  - 搜索、筛选、排序、分页
  - 自定义列表表头
  - 批量选择与批量删除
- 穿搭日历（OOTD）
  - 月历浏览
  - 当天详情
  - 穿搭候选池
  - 新增、编辑、删除穿搭
  - 每天最多 5 套穿搭
- 数据分析
  - 品类切换
  - 消费趋势
  - 穿搭趋势
  - 品类 / 颜色 / 品牌分布
  - 穿着次数 / 闲置 / 单次价格排行
- Excel 导入
  - 模板下载
  - Excel 解析预览
  - 图片 ZIP 匹配导入
- 双语
  - 中文 / English

### 技术栈

- Frontend: Next.js, React, Tailwind CSS
- Backend: Next.js Route Handlers, TypeScript
- Database: PostgreSQL
- ORM: Prisma

### 项目结构

- `app/`: 页面与 API 路由
- `components/`: UI 与业务组件
- `features/`: 页面级数据聚合与查询
- `server/`: 服务层逻辑
- `lib/`: 公共工具、搜索、状态同步逻辑
- `prisma/`: Prisma schema 与 migrations
- `docs/`: 架构、数据库、后端、前端、同步、移动端和 PRD 文档

### 环境要求

- Node.js 20+
- PostgreSQL 16+

### 启动步骤

1. 安装依赖

```bash
npm install
```

2. 复制环境变量

```bash
cp .env.example .env
```

3. 配置数据库连接

在 `.env` 中设置：

```env
DATABASE_URL="postgresql://<your-user>@localhost:5432/smart_wardrobe"
```

4. 执行 Prisma migration

```bash
npx prisma migrate dev
npx prisma generate
```

5. 启动开发环境

```bash
npm run dev
```

默认地址：

- [http://localhost:3000](http://localhost:3000)

### 重要说明

- 本项目当前依赖多条 Prisma migration，首次启动前必须执行 `npx prisma migrate dev`
- 衣物购买时间为空时，会自动回退到更新时间，并以 `YYYY-MM-DD` 形式返回
- 穿着次数已拆分为：
  - 手动记录
  - 穿搭日历统计
- 右上角穿搭候选数量使用 `localStorage + cookie` 同步，以减少页面切换时的数字抖动

### 常用命令

```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:migrate
```
---

## English

Smart Wardrobe is a personal digital wardrobe and outfit calendar app. The current build already supports real wardrobe CRUD, OOTD calendar workflows, search and filtering, analytics, Excel import, and image ZIP matching import.

### Current Features

- Wardrobe management
  - create, edit, and review items
  - list / grid views
  - search, filter, sort, and pagination
  - customizable list columns
  - batch select and batch delete
- OOTD calendar
  - monthly calendar view
  - selected-day detail panel
  - outfit candidate pool
  - create, edit, and delete looks
  - up to 5 looks per day
- Analytics
  - category-scoped overview
  - spend trend
  - OOTD trend
  - category / color / brand breakdown
  - top worn / idle / cost-per-wear rankings
- Excel import
  - downloadable template
  - preview before import
  - optional image ZIP matching
- Bilingual UI
  - Chinese / English

### Tech Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Next.js Route Handlers, TypeScript
- Database: PostgreSQL
- ORM: Prisma

### Project Structure

- `app/`: pages and API routes
- `components/`: UI and feature components
- `features/`: page-level data aggregation
- `server/`: service-layer logic
- `lib/`: shared utilities, search, sync helpers
- `prisma/`: Prisma schema and migrations
- `docs/`: architecture, database, backend, frontend, sync, mobile, and PRD docs

### Requirements

- Node.js 20+
- PostgreSQL 16+

### Getting Started

1. Install dependencies

```bash
npm install
```

2. Copy environment variables

```bash
cp .env.example .env
```

3. Configure the database URL

In `.env`:

```env
DATABASE_URL="postgresql://<your-user>@localhost:5432/smart_wardrobe"
```

4. Run Prisma migrations

```bash
npx prisma migrate dev
npx prisma generate
```

5. Start the dev server

```bash
npm run dev
```

Default URL:

- [http://localhost:3000](http://localhost:3000)

### Notes

- The app depends on multiple Prisma migrations. Run `npx prisma migrate dev` before first launch.
- If an item has no purchase date, the app falls back to its update date and returns it as `YYYY-MM-DD`.
- Wear counts are split into:
  - manual values
  - OOTD-derived values
- The top-right outfit candidate count is synchronized through `localStorage + cookie` to reduce navigation flicker.

### Common Commands

```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:migrate
```
