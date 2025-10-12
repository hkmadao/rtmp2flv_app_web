const fs = require('fs');
const os = require('os');
const path = require('path');

type TRoute = {
  path: string;
  name: string;
  component: string;
  exact: boolean;
  routes?: TRoute[];
};

type MenuDataItem = {
  path?: string;
  displayName?: string;
  [key: string]: any;
};

// 读取pages下的目录，找到带route.json文件目录
const pageDir: string = './src/views/';
const files = fs.readdirSync(path.join(__dirname, pageDir));
const dynamicRouters: TRoute[] = [];
const dynamicMenus: MenuDataItem[] = [];
files.forEach((item: string) => {
  const stat = fs.statSync(path.join(__dirname, pageDir) + item);
  if (
    stat.isDirectory() === true &&
    fs.existsSync(path.join(__dirname, `${pageDir}${item}/route.json`))
  ) {
    const data = fs.readFileSync(`${pageDir}${item}/route.json`).toString();
    console.log(data.toString());
    const route: TRoute = JSON.parse(data.toString());
    dynamicRouters.push(route);
    dynamicMenus.push({
      path: route.path,
      displayName: route.name,
    });
  }
});

// 输出到动态路由文件
const drs = `// 以下文件执行genRoute自动生成，请勿手动修改
export default ${JSON.stringify(dynamicRouters, null, 4)}
`;
const reqExp:RegExp = /"component": ("~\/views\/.*"),?/g;
const drsResult = drs.replace(reqExp,'"component": () => import($1),');

fs.writeFile('./router/dynamic-routes.ts', drsResult, function (err: any) {
  if (err) {
    return console.error(err);
  }
  console.log('动态路由写入成功！');
});

// 输出到动态菜单文件
const dms = `// 以下文件执行genRoute自动生成，请勿手动修改
type TMenu = {
    path?: string;
    displayName: string;
}

const menus: TMenu[] = ${JSON.stringify(dynamicMenus, null, 4)};

export default menus;`;
fs.writeFile('./src/components/layouts/dynamic-menus.ts', dms, function (err: any) {
  if (err) {
    return console.error(err);
  }
  console.log('动态菜单写入成功！');
});
