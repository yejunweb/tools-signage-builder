import { useState } from 'react';

import { App as AntdApp, ConfigProvider } from 'antd';

import { THEME_PRIMARY } from '@/constants/signage';
import SignEdit from '@/views/SignEdit';
import SignList from '@/views/SignList';

import './App.css';

type RouteState = { page: 'list' } | { page: 'edit'; recordId?: string };

function App() {
    const [route, setRoute] = useState<RouteState>({ page: 'list' });
    const [listKey, setListKey] = useState(0);

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: THEME_PRIMARY,
                    borderRadius: 8,
                    fontFamily: "'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
                },
            }}
        >
            <AntdApp className='app-root'>
                {route.page === 'list' ? (
                    <SignList
                        refreshKey={listKey}
                        onCreate={() => setRoute({ page: 'edit' })}
                        onEdit={id => setRoute({ page: 'edit', recordId: id })}
                    />
                ) : (
                    <SignEdit
                        key={route.recordId ?? 'new'}
                        recordId={route.recordId}
                        onBack={() => setRoute({ page: 'list' })}
                        onSaved={() => setListKey(k => k + 1)}
                    />
                )}
            </AntdApp>
        </ConfigProvider>
    );
}

export default App;
