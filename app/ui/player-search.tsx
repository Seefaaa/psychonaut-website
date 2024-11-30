'use client';

import { faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import fetcher from '@/app/lib/fetcher';
import Button from '@/app/ui/button';

export default function PlayerSearch() {
	const inputRef = useRef<HTMLInputElement>(null);
	const timeoutRef = useRef(0);

	const [input, setInput] = useState('');
	const [autocomplete, setAutocomplete] = useState<string[]>([]);

	const { data, error, isLoading } = useSWRImmutable<string[]>('/api/autocomplete/ckey?ckey=' + input, fetcher, {
		isPaused: () => inputRef.current ? inputRef.current.value.length === 0 : true,
	});

	const onInput = useCallback(() => {
		clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			setInput(inputRef.current?.value ?? '');
		}, 500) as any as number;
	}, []);

	useEffect(() => {
		if (input.length === 0) {
			setAutocomplete([]);
		} else if (data) {
			setAutocomplete(data);
		}
	}, [input, data]);

	useEffect(() => {
		setTimeout(() => {
			inputRef.current?.focus();
		}, 1);
	}, []);

	return (
		<div className="flex-1 flex flex-col items-center gap-5">
			<div className="flex items-center px-3 py-2 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-[.25rem] text-center">
				<input className="h-full flex-1 bg-transparent outline-none" ref={inputRef} onInput={onInput} placeholder="Oyuncu ara"></input>
				<div className="w-5 flex justify-center"><Icon icon={isLoading ? faSpinner : faSearch} spin={isLoading} className={`${isLoading && 'opacity-50'} text-white align-middle`} /></div>
			</div>
			{autocomplete.length > 0 && (
				<div className="flex flex-wrap justify-center gap-4 px-2 pt-1 sm:px-14 lg:px-60">
					{autocomplete.map((ckey) => (
						<Link key={ckey} href={`/players/${ckey}`} prefetch={false}>
							<Button>{ckey}</Button>
						</Link>
					))}
				</div>
			)}
			{error && (
				<span className="text-red-500 pb-5">An error has occurred: {error.message}</span>
			)}
		</div>
	);
}
