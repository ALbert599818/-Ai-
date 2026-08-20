# 智能报价系统

一个报价管理系统（报价引擎 + 客户/产品/报价单/折扣系数/公式配置），**已彻底解除飞书绑定**，可本地运行、可打包成双击即用的压缩包、也可部署到公网通过网址访问。

> 技术栈：React 19 + Vite（前端）· NestJS 10（后端）· Drizzle ORM + PostgreSQL（数据库）

---

## 一、前置条件

- 安装 **Node.js 22 或更高版本**（[nodejs.org](https://nodejs.org) 下载 LTS 即可）
- 一个 **PostgreSQL 数据库**（推荐免费云库 Neon，见下一步）

> 不需要 Docker，不需要本地安装数据库。

---

## 二、准备数据库（免费云库 Neon，5 分钟）

1. 打开 [neon.tech](https://neon.tech)，用 GitHub/Google 账号注册（免费）。
2. 新建一个 Project，等待数据库创建完成。
3. 复制它给你的 **连接字符串**，形如：
   ```
   postgresql://用户名:密码@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. 打开项目根目录的 `.env` 文件，把连接字符串填到 `DATABASE_URL=` 后面：
   ```
   DATABASE_URL=postgresql://用户名:密码@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

> 首次启动会自动建表，并创建一个默认管理员账号（用户名 `admin`，密码 `admin`，可在 `.env` 里改）。

---

## 三、本地运行

```bash
# 1. 安装依赖（首次）
npm install

# 2. 启动（同时起后端 + 前端，前端会自动代理 /api 到后端）
npm run dev
```

- 前端开发服务器：http://localhost:5173
- 后端 API：http://localhost:3000/api

浏览器打开 http://localhost:5173 ，用 `admin / admin` 登录即可。

---

## 四、打包成「双击图标就打开」的程序（发给别人）

### 方式 A：打包成单个 exe（像游戏一样，推荐）

打成一个独立的 `.exe` 文件，对方**双击图标**就能打开——独立窗口、没有黑色命令行，跟游戏一样：

```bash
# 1. 先在 .env 里填好 DATABASE_URL（打包时会烧进 exe）
# 2. 打包（会自动构建 + 用 Electron 打成单文件 exe）
npm run package:exe
```

完成后，`release/` 目录里会生成 **`QuotationSystem-1.0.0-portable.exe`**（约 80MB）。把这个 exe 直接发给对方，对方双击就能用，**不装 Node、不装 Docker**。

> 首次打包需联网下载 Electron（约 115MB，已配置国内镜像加速），之后会缓存，很快。

### 方式 B：打包成「便携文件夹 + 启动器」（轻量，约 30MB）

如果嫌 exe 太大，也可以用轻量方案（解压后双击 `启动.bat`）：

```bash
npm run package:desktop
```

把 `release/` 文件夹压缩成 zip 发给对方，解压后双击 `启动.bat` 即可。

> 两种方式都连接你在 `.env` 里配好的同一个 Neon 数据库，看到同一份数据。

---

## 五、部署到公网（简历上附网址，别人点开就能看）

项目是「前后端一体」的 Node 服务，部署到免费平台就能得到一个公开网址。需要你有一个 **GitHub 账号**（免费注册）。

### 第 0 步：把项目推送到 GitHub（一次性）

```bash
git init
git add .
git commit -m "init"
# 到 github.com 新建一个空仓库，然后：
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

> `.gitignore` 已配好，会自动忽略 `node_modules`、`.env`（数据库密码）、`dist`、`release` 等大文件/敏感文件，只传源码。

### 第 1 步：部署（二选一）

**A. Railway（最简单，推荐）**

1. 打开 [railway.app](https://railway.app)，用 GitHub 账号登录。
2. 点 **New Project → Deploy from GitHub**，选择刚才的仓库。
3. Railway 会自动识别 Node 项目并构建（会执行 `npm install` 和 `npm run build`）。
4. 在项目 Settings → Variables 里添加环境变量：
   - `DATABASE_URL` = 你的 Neon 连接字符串
   - `SERVER_HOST` = `0.0.0.0`
5. 部署完成后，到 **Networking → Generate Domain** 生成公开网址，形如 `https://xxx.up.railway.app`，放到简历即可。

**B. Render（免费，也简单）**

1. 打开 [render.com](https://render.com)，注册登录。
2. **New → Web Service**，连接 GitHub 仓库。
3. 设置：
   - **Build Command**：`npm install && npm run build`
   - **Start Command**：`npm start`
4. 添加环境变量 `DATABASE_URL` 和 `SERVER_HOST=0.0.0.0`。
5. 部署完成后会得到一个 `https://xxx.onrender.com` 网址。

> 两者共用你 `.env` 里那个 Neon 数据库，**网页和 exe 看到的是同一份数据**。首次启动会自动建表（幂等，不会重复）。

---

## 六、常用命令

| 命令 | 作用 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 本地开发（前端 5173 + 后端 3000） |
| `npm run build` | 构建生产产物到 `dist/` |
| `npm start` | 运行已构建的后端（需先 build） |
| `npm run package:exe` | 打包成单个 exe（双击图标即用，推荐） |
| `npm run package:desktop` | 打包成便携文件夹 + 启动器（轻量） |
| `npm run type:check` | 前后端类型检查 |

---

## 七、默认账号与角色

首次启动自动创建的默认管理员：

- 用户名：`admin`
- 密码：`admin`

系统内置三种角色（在「用户管理」里可给用户分配）：

| 角色 | 说明 |
|------|------|
| `super_admin` | 超级管理员（全部菜单） |
| `admin` | 报价管理员 |
| `quotation_editor` | 报价申报员 |

---

## 八、关于「角色管理」菜单的说明

原飞书版的「角色管理」页面依赖飞书企业组织/通讯录 SDK（管理的是飞书的部门、群聊、成员），脱离飞书后无法运行。因此在去飞书化的过程中**移除了该页面**——而「给用户分配角色」这个功能本身不受影响，仍在 **系统管理 → 用户管理** 里正常使用。
