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

const TOUR_EVENT = 'sport-center:product-tour:start';

export function replayProductTour(storageKey: string) {
    try {
        window.localStorage.removeItem(storageKey);
    } catch {
        // Tour can still be started if browser storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent(TOUR_EVENT, { detail: { storageKey } }));
}

export function ProductTour({
    storageKey,
    steps,
    autoStart = true,
}: {
    storageKey: string;
    steps: TourStep[];
    autoStart?: boolean;
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
                return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth;
            }),
        [steps],
    );

    const startTour = useCallback(() => {
        const visibleSteps = findAvailableSteps();
        if (!visibleSteps.length) return;
        setAvailableSteps(visibleSteps);
        setIndex(0);
        setBox(null);
        setOpen(true);
        try {
            window.localStorage.setItem(storageKey, 'seen');
        } catch {
            // Keep the tour usable when storage is disabled.
        }
    }, [findAvailableSteps, storageKey]);

    const step = availableSteps[index];

    const close = useCallback(() => {
        setOpen(false);
        setBox(null);
    }, []);

    const updateTarget = useCallback(() => {
        if (!step) return;
        const target = document.querySelector(step.target);
        if (!(target instanceof HTMLElement)) {
            setBox(null);
            return;
        }
        const rect = target.getBoundingClientRect();
        setBox({
            top: Math.max(4, rect.top - 6),
            left: Math.max(4, rect.left - 6),
            width: Math.max(8, Math.min(window.innerWidth - 8, rect.width + 12)),
            height: Math.max(8, Math.min(window.innerHeight - 8, rect.height + 12)),
        });
    }, [step]);

    useEffect(() => {
        const onStart = (event: Event) => {
            const customEvent = event as CustomEvent<{ storageKey?: string }>;
            if (customEvent.detail?.storageKey === storageKey) startTour();
        };
        window.addEventListener(TOUR_EVENT, onStart);
        if (!autoStart || window.localStorage.getItem(storageKey)) {
            return () => window.removeEventListener(TOUR_EVENT, onStart);
        }
        const timer = window.setTimeout(startTour, 700);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener(TOUR_EVENT, onStart);
        };
    }, [autoStart, startTour, storageKey]);

    useEffect(() => {
        if (!open || !step) return;
        const target = document.querySelector(step.target);
        if (!(target instanceof HTMLElement)) {
            setBox(null);
            return;
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        const timer = window.setTimeout(updateTarget, 350);
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
            if (event.key === 'ArrowRight') setIndex((current) => Math.min(availableSteps.length - 1, current + 1));
            if (event.key === 'ArrowLeft') setIndex((current) => Math.max(0, current - 1));
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [availableSteps.length, close, open]);

    if (!open || !step || !box) return null;

    const tooltipBelow = box.top + box.height + 240 < window.innerHeight;
    const tooltipTop = tooltipBelow
        ? box.top + box.height + 14
        : Math.max(14, box.top - 220);
    const tooltipLeft = Math.min(
        Math.max(14, box.left),
        Math.max(14, window.innerWidth - 368),
    );

    return (
        <div className="product-tour" aria-live="polite">
            <button
                className="product-tour-backdrop"
                type="button"
                aria-label="Lewati tur"
                onClick={close}
            />
            <div className="product-tour-highlight" aria-hidden="true" style={box} />
            <section
                className="product-tour-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${storageKey}-title`}
                style={{ top: tooltipTop, left: tooltipLeft }}
            >
                <button className="product-tour-close" type="button" onClick={close} aria-label="Tutup tur">
                    <X aria-hidden="true" />
                </button>
                <small>Langkah {index + 1} dari {availableSteps.length}</small>
                <h2 id={`${storageKey}-title`}>{step.title}</h2>
                <p>{step.description}</p>
                <div className="product-tour-actions">
                    <button className="text-button" type="button" onClick={close}>Lewati</button>
                    <span>
                        {index > 0 && (
                            <button className="icon-button" type="button" onClick={() => setIndex((current) => current - 1)} aria-label="Langkah sebelumnya">
                                <ChevronLeft aria-hidden="true" />
                            </button>
                        )}
                        <button className="button" type="button" onClick={() => index === availableSteps.length - 1 ? close() : setIndex((current) => current + 1)}>
                            {index === availableSteps.length - 1 ? 'Selesai' : 'Berikutnya'}
                            {index < availableSteps.length - 1 && <ChevronRight aria-hidden="true" />}
                        </button>
                    </span>
                </div>
            </section>
        </div>
    );
}
