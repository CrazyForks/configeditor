import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export function WelcomeFragment() {
    return <div className="w-full h-[100%] p-8 bg-content1 dark:bg-content2 flex flex-col items-center heroui-transition" style={{ maxHeight: '100%', overflow: 'auto' }}>
        <div className="flex flex-col max-w-4xl w-full">
            <h2 className="text-3xl font-bold mb-8 text-foreground text-center">欢迎使用配置文件管理器</h2>

            <div className="heroui-card heroui-card-hover p-6 mb-6 heroui-transition">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                    快速入门
                </h3>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                    <li>在左侧面板中，点击 <span className="font-medium text-primary px-2 py-1 bg-primary/10 rounded-md">+</span> 按钮引用新的配置文件</li>
                    <li>点击文件名以选择并编辑配置文件</li>
                    <li>使用顶部工具栏中的 <span className="font-medium text-success px-2 py-1 bg-success/10 rounded-md">保存</span> 按钮保存更改（可能需要权限）</li>
                    <li>使用 <span className="font-medium text-warning px-2 py-1 bg-warning/10 rounded-md">刷新</span> 按钮重新加载配置文件（可自定义刷新命令）</li>
                    <li>悬停在文件上可以看到移除按钮，点击即可移除文件</li>
                </ol>
            </div>

            <div className="heroui-card heroui-card-hover p-6 mb-6 heroui-transition">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                    <span className="w-2 h-2 bg-success rounded-full mr-3"></span>
                    功能亮点
                </h3>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                    <li>简洁直观的用户界面，支持浅色/深色主题</li>
                    <li>快速管理和刷新多个配置文件</li>
                    <li>文件路径一键复制</li>
                    <li>支持本地和远程文件编辑</li>
                    <li>实时文件状态监控</li>
                </ul>
            </div>

            <div className="apple-card apple-card-hover p-6 apple-transition">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                    <span className="w-2 h-2 bg-apple-purple rounded-full mr-3"></span>
                    了解更多
                </h3>
                <p className="mb-4 text-muted-foreground">访问我们的 GitHub 仓库，获取详细文档、报告问题或贡献代码：</p>
                <Button 
                    variant="outline" 
                    className="flex items-center apple-button-secondary border-apple-gray-5 hover:border-apple-blue hover:bg-apple-blue/5 apple-transition" 
                    onClick={() => window.open('https://github.com/heroisuseless/configeditor', '_blank')}
                >
                    <Github className="mr-2 h-4 w-4" />
                    访问 GitHub 仓库
                </Button>
            </div>
        </div>
    </div>
}
