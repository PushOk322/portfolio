import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATH } from '../constants';

export const useCommonHistory = (location, isLGTV, isTizenTV) => {
    const navigate = useNavigate();

    useEffect(() => {
        const handlePopState = () => {
            const currentPath = location.pathname;
            console.log(currentPath);

            if (currentPath === `/${PATH.HOME}`) {
                // Предотвращаем навигацию назад, если пользователь находится на главной странице
                window.history.pushState(null, null, currentPath);
                return;
            }
            if (isLGTV || isTizenTV) {
                return;
            }

            if (currentPath === `/${PATH.ACCOUNT}/${PATH.ACCOUNT_SETTINGS}`) {
                navigate(`${PATH.HOME}`);
            } else if (currentPath.startsWith(`/${PATH.ACCOUNT}`)) {
                navigate(`${PATH.ACCOUNT}/${PATH.ACCOUNT_SETTINGS}`);
            } else if (currentPath.startsWith(`/${PATH.COURSES}`)) {
                if (currentPath !== `/${PATH.COURSES}`) {
                    navigate(`${PATH.COURSES}`);
                } else {
                    navigate(`${PATH.HOME}`);
                }
            } else if (currentPath.startsWith(`/${PATH.AUTH}`)) {
                if (currentPath !== `/${PATH.AUTH}`) {
                    navigate(`${PATH.AUTH}`);
                } else {
                    navigate(`${PATH.ACCOUNT}/${PATH.ACCOUNT_SETTINGS}`);
                }
            } else {
                window.history.back();
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [location.pathname, isLGTV, isTizenTV, navigate]); // Зависимости обновлены
};
