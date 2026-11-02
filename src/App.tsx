import { Button, ConfigProvider, Typography } from 'antd';

import './App.css';

const THEME_PRIMARY = '#3370ff';

function App() {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: THEME_PRIMARY,
                },
            }}
        >
            <main className='app'>
                <Typography.Title level={2}>标牌生成器</Typography.Title>
                <Typography.Paragraph type='secondary'>脚手架占位页 · 主题色 {THEME_PRIMARY}</Typography.Paragraph>
                <Button type='primary'>主色按钮</Button>
            </main>
        </ConfigProvider>
    );
}

export default App;
