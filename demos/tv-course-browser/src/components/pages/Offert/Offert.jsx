import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import './Offert.scss';
import Container from '../../containers/Container/Container.jsx';
import { lang } from '../../../dictionaries/index.js';
import useUserStore from '../../../store/useUserStore.js';
import useOffertStore from '../../../store/useOffertStore.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Offert = () => {
    const { fetchOffertData } = useOffertStore((state) => ({
        fetchOffertData: state.fetchOffertData
    }));

    useEffect(() => {
        fetchOffertData();
    }, [fetchOffertData]);

    const { offert } = useOffertStore((state) => ({
        offert: state.offert
    }));

    const memoizedOffert = useMemo(() => offert, [offert]);

    const { locale } = useUserStore((state) => ({
        locale: state.user.locale
    }));

    //scroll-logic------------------------------------------------

    const contentRef = useRef(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [offertHeight, setOffertHeight] = useState(0);

    useEffect(() => {
        if (contentRef.current) {
            setOffertHeight(contentRef.current.scrollHeight);
        }
    }, [memoizedOffert]);

    const handleKeyDown = useCallback((e) => {
        if (contentRef.current) {
            const maxScrollPosition = offertHeight - contentRef.current.clientHeight;

            let newPosition = scrollPosition;

            switch (e.keyCode) {
                case 38: // Стрелка вверх
                    e.preventDefault();
                    newPosition = Math.max(scrollPosition - 300, 0);
                    break;
                case 40: // Стрелка вниз
                    e.preventDefault();
                    newPosition = Math.min(scrollPosition + 300, maxScrollPosition);
                    break;
                default:
                    break;
            }

            if (newPosition !== scrollPosition) {
                setScrollPosition(newPosition);
                contentRef.current.scrollTop = newPosition;
            }
        }
    }, [scrollPosition, offertHeight]);

    useEffect(() => {
        const element = contentRef.current;
        if (element) {
            element.style.paddingBottom = '11vw';
        }
    }, [memoizedOffert]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <div className={`offert`}>
            <Container>
                <div className={`offert__content`} ref={contentRef} style={{ maxHeight: '100vh', overflowY: 'auto' }} id='contentOffert'>
                    <h2 className='offert__content-title'>
                        {lang[locale].offertTitle}
                    </h2>
                    <div className='offert__content-markdown'>
                        {offert && (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {memoizedOffert.data}
                            </ReactMarkdown>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default Offert;
