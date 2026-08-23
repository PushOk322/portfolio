import { useEffect, useRef } from "react";
import { Howl } from 'howler';
import keySound from '../assets/sounds/ipad_click.mp3';

export const useSound = (location) => {
    const sound = useRef(new Howl({
        src: [keySound],
        volume: 0.5,
    }));
    const isThrottled = useRef(false);

    useEffect(() => {
        const handleKeyPress = () => {
            if (!isThrottled.current) {
                isThrottled.current = true;
                sound.current.play();
                setTimeout(() => {
                    isThrottled.current = false;
                }, 200); // Задержка в 100 мс между проигрыванием звука
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [location]);

};
