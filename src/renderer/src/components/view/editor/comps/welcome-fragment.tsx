import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export function WelcomeFragment() {
    return <div className="w-full h-[100%] p-8 bg-gray-50 flex flex-col items-center" style={{ maxHeight: '100%', overflow: 'auto' }}>
        <div className="flex flex-col">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">欢迎使用配置文件管理器</h2>

            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">快速入门</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    <li>在左侧面板中，点击 <span className="font-medium">+</span> 按钮引用新的配置文件</li>
                    <li>点击文件名以选择并编辑配置文件</li>
                    <li>使用顶部工具栏中的 <span className="font-medium">保存</span> 按钮保存更改（可能需要权限）</li>
                    <li>使用 <span className="font-medium">刷新</span> 按钮重新加载配置文件（可自定义刷新命令）</li>
                    <li>悬停在文件上可以看到移除按钮，点击即可移除文件</li>
                </ol>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">功能亮点</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>简洁直观的用户界面</li>
                    <li>快速管理和刷新多个配置文件</li>
                    <li>文件路径一键复制</li>
                </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">了解更多</h3>
                <p className="mb-4 text-gray-600">访问我们的 GitHub 仓库，获取详细文档、报告问题或贡献代码：</p>
                <Button variant="outline" className="flex items-center" onClick={() => window.open('https://github.com/yourusername/config-manager', '_blank')}>
                    <Github className="mr-2 h-4 w-4" />
                    访问 GitHub 仓库
                </Button>
            </div>
        </div>
    </div>
}
