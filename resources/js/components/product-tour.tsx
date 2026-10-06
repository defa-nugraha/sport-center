import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type TourStep = {
    target: string;
    title: string;
    description: string;
};

type TargetBox = {
    top: number;
    left: number;
    width: number;
    height: number;
};

export function ProductTour({
    storageKey,
    steps,
}: {
    storageKey: string;
    steps: TourStep[];
}) {
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const [box, setBox] = useState<TargetBox | null>(null);
    const [availableSteps, setAvailableSteps] = useState<TourStep[]>([]);

    const findAvailableSteps = useCallback(
        () =>
            steps.filter((step) => {
                const target = document.querySelector(step.target);
                if (!(target instanceof HTMLElement)) return false;
                const rect = target.getBoundingClientRect();
                return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    rect.right > 0 &&
                    rect.bottom > 0 &&
                    rect.left < window.innerWidth
                );
            }),
        [steps],
    );
    const step = availableSteps[index];

    const close = useCallback(() => {
        setOpen(false);
        setBox(null);
    }, []);

    const updateTarget = useCallback(() => {
        if (!step) return;
        const target = document.querySelector(step.target);
        if (!(target instanceof HTMLElement)) return;
        const rect = target.getBoundingClientRect();
        setBox({
            top: Math.max(8, rect.top - 6),
            left: Math.max(8, rect.left - 6),
            width: Math.min(window.innerWidth - 16, rect.width + 12),
            height: Math.min(window.innerHeight - 16, rect.height + 12),
        });
    }, [step]);

    useEffect(() => {
        if (localStorage.getItem(storageKey)) return;
        const timer = window.setTimeout(() => {
            const visibleSteps = findAvailableSteps();
            if (!visibleSteps.length) return;
            localStorage.setItem(storageKey, 'seen');
            setAvailableSteps(visibleSteps);
            setOpen(true);
        }, 700);
        return () => window.clearTimeout(timer);
    }, [findAvailableSteps, storageKey]);

    useEffect(() => {
        if (!open || !step) return;
        const target = document.querySelector(step.target);
        if (!(target instanceof HTMLElement)) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const timer = window.setTimeout(updateTarget, 300);
        window.addEventListener('resize', updateTarget);
        window.addEventListener('scroll', updateTarget, true);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('resize', updateTarget);
            window.removeEventListener('scroll', updateTarget, true);
        };
    }, [open, step, updateTarget]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [close, open]);

    if (!open || !step || !box) return null;

    const tooltipBelow = box.top + box.height + 260 < window.innerHeight;
    const tooltipTop = tooltipBelow
        ? box.top + box.height + 14
        : Math.max(14, box.top - 230);
    const tooltipLeft = Math.min(
        Math.max(14, box.left),
        Math.max(14, window.innerWidth - 354),
    );

    return (
        <div className="product-tour" aria-live="polite">
            <button
                className="product-tour-backdrop"
                type="button"
                aria-label="Lewati tur"
                onClick={close}
            />
            <div
                className="product-tour-highlight"
                aria-hidden="true"
                style={box}
            />
            <section
                className="product-tour-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${storageKey}-title`}
                style={{ top: tooltipTop, left: tooltipLeft }}
            >
                <button
                    className="product-tour-close"
                    type="button"
                    onClick={close}
                    aria-label="Tutup tur"
                >
                    <X aria-hidden="true" />
                </button>
                <small>
                    Langkah {index + 1} dari {availableSteps.length}
                </small>
                <h2 id={`${storageKey}-title`}>{step.title}</h2>
                <p>{step.description}</p>
                <div className="product-tour-actions">
                    <button className="text-button" type="button" onClick={close}>
                        Lewati
                    </button>
                    <span>
                        {index > 0 && (
                            <button
                                className="icon-button"
                                type="button"
                                onClick={() => setIndex((current) => current - 1)}
                                aria-label="Langkah sebelumnya"
                            >
                                <ChevronLeft aria-hidden="true" />
                            </button>
                        )}
                        <button
                            className="button"
                            type="button"
                            onClick={() =>
                                index === availableSteps.length - 1
                                    ? close()
                                    : setIndex((current) => current + 1)
                            }
                        >
                            {index === availableSteps.length - 1
                                ? 'Selesai'
                                : 'Berikutnya'}
                            {index < availableSteps.length - 1 && (
                                <ChevronRight aria-hidden="true" />
                            )}
                        </button>
                    </span>
                </div>
            </section>
        </div>
    );
}
