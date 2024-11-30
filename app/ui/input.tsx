'use client';

import { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

type NumberInputProps = {} & React.InputHTMLAttributes<HTMLInputElement>;

export const NumberInput = forwardRef((props: NumberInputProps, ref: ForwardedRef<HTMLInputElement>) => {
	const inputRef = useRef<HTMLInputElement>(null);

	useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

	const className = useMemo(() => (props.className ? `${props.className} ` : ''), [props.className]);

	const min = props.min;
	const max = props.max;
	const onChange = props.onChange;

	useEffect(() => {
		const preventScroll = (e: Event) => {
			if (inputRef.current && e.target === inputRef.current) {
				e.preventDefault();
				e.stopPropagation();

				const deltaY = (e as WheelEvent).deltaY > 0 ? -1 : 1;
				const value = Number(inputRef.current.value) + deltaY;

				if (
					(min !== undefined && value < Number(min)) ||
					(max !== undefined && value > Number(max))
				) {
					return;
				}

				inputRef.current.value = String(value);

				onChange?.({
					target: inputRef.current,
					currentTarget: inputRef.current,
					persist: () => {},
					stopPropagation: () => {},
					preventDefault: () => {},
				} as React.ChangeEvent<HTMLInputElement>);
			}
		};

		document.body.firstChild?.addEventListener('wheel', preventScroll, { passive: false });

		return () => {
			document.body.firstChild?.removeEventListener('wheel', preventScroll);
		};
	}, [min, max, onChange]);

	return (
		<input
			{...props}
			className={`${className}bg-transparent outline-none text-center caret-white transition-opacity`}
			ref={inputRef}
			type="number"
		/>
	);
});

NumberInput.displayName = 'NumberInput';
