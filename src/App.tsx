import { useState } from 'react';

import { App as AntdApp, ConfigProvider } from 'antd';

import { THEME_PRIMARY } from '@/constants/signage';
import SignEdit from '@/views/SignEdit';
import SignList from '@/views/SignList';

import './App.css';

type RouteState = { page: 'list' } | { page: 'edit'; recordId?: string };
type NavDirection = 'forward' | 'back';

function App() {
    const [route, setRoute] = useState<RouteState>({ page: 'list' });
    const [listKey, setListKey] = useState(0);
    /** 列表↔编辑水平过渡方向：进编辑=forward，回列表=back；不做弹窗过渡 */
    const [navDir, setNavDir] = useState<NavDirection | null>(null);
    const [transitionKey, setTransitionKey] = useState(0);

    const goList = () => {
        setNavDir('back');
        setTransitionKey(k => k + 1);
        setRoute({ page: 'list' });
    };

    const goCreate = () => {
        setNavDir('forward');
        setTransitionKey(k => k + 1);
        setRoute({ page: 'edit' });
    };

    const goEdit = (id: string) => {
        setNavDir('forward');
        setTransitionKey(k => k + 1);
        setRoute({ page: 'edit', recordId: id });
    };

    const pageClass = navDir ? `app-page app-page--${navDir}` : 'app-page';

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
                <div
                    key={transitionKey}
                    className={pageClass}
                    onAnimationEnd={e => {
                        if (e.target !== e.currentTarget) return;
                        setNavDir(null);
                    }}
                >
                    {route.page === 'list' ? (
                        <SignList
                            refreshKey={listKey}
                            onCreate={goCreate}
                            onEdit={goEdit}
                        />
                    ) : (
                        <SignEdit
                            key={route.recordId ?? 'new'}
                            recordId={route.recordId}
                            onBack={goList}
                            onSaved={() => setListKey(k => k + 1)}
                        />
                    )}
                </div>
            </AntdApp>
        </ConfigProvider>
    );
}

export default App;
