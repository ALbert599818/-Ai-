import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class ViewController {

  @Get(['/', '*'])
  @Render('index')
  async render(): Promise<{ __platform__: string }> {
    return {
      // 独立运行已无需平台注入数据，保留占位以兼容模板渲染
      __platform__: JSON.stringify({}),
    };
  }
}
