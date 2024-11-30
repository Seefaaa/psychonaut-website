'use client';

import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import useResize from '@/app/hooks/useResize';
import { antagonist_roles, ghost_roles, non_roles, spawner_roles, trait_roles } from '@/app/lib/constants';
import type { Player } from '@/app/lib/definitions';
import { relativeTime } from '@/app/lib/time';
import Button from '@/app/ui/button';
import { NumberInput } from '@/app/ui/input';

const all_roles = [...non_roles, ...trait_roles, ...spawner_roles, ...ghost_roles, ...antagonist_roles];

type NonNullablePlayer = NonNullable<Player>;

type PlayerProps = {
	player: NonNullablePlayer;
};

export default function Player({ player }: PlayerProps) {
	useEffect(() => {
		document.getElementById('navigation')?.scrollIntoView({ behavior: 'smooth' });
	}, []);

	return (
		<div className="w-full max-w-full flex-1 flex flex-col items-center gap-5">
			{/* Basic Info */}
			<div className="max-w-full flex flex-col items-center gap-3">
				<span className="max-w-full text-center text-5xl font-bold overflow-hidden text-ellipsis">{player.byond_key}</span>
				<span>İlk Görülen Round: {player.first_seen_round}</span>
				<span>Son Görülen Round: {player.last_seen_round}</span>
				<span>İlk Görülen Tarih: {player.first_seen}</span>
				<span>Son Görülen Tarih: {player.last_seen}</span>
				<span>BYOND&apos;a Katıldığı Tarih: {player.byond_age}</span>
			</div>
			{/* Characters */}
			<div className="flex flex-col items-center gap-3">
				<span className="text-center text-3xl font-bold">Karakterler</span>
				<div className="flex flex-wrap justify-center gap-4 px-2 py-6 sm:px-14 md:px-18 xl:px-60">
					{player.characters.length ? player.characters.map(([character]) => (
						<Button key={character}>{character}</Button>
					)) : (
						<span>Hiçbir karakter bulunamadı.</span>
					)}
				</div>
			</div>
			{/* Activity */}
			<div className="w-full flex flex-col items-center gap-3 sm:px-14 lg:px-48">
				<span className="text-center text-3xl font-bold">Aktivite</span>
				{player.activity.length ? (
					<ActivityChart activity={player.activity} />
				) : (
					<div className="flex justify-center py-6">
						<span>180 gün içerisinde hiçbir aktivite bulunamadı.</span>
					</div>
				)}
			</div>
			{/* Roletimes */}
			<div className="w-full flex flex-col items-center gap-3 sm:px-14 lg:px-48">
				<span className="text-center text-3xl font-bold">Rol Süreleri</span>
				{player.roletime.length ? (
					<RoletimeChart roletime={player.roletime} />
				) : (
					<div className="flex justify-center py-6">
						<span>Hiçbir rol bulunamadı.</span>
					</div>
				)}
			</div>
			{/* Ban History */}
			<div className="w-full flex flex-col items-center gap-3 sm:px-14 lg:px-48">
				<span className="text-center text-3xl font-bold" title="Yalnızca kalıcı olan banlar gösteriliyor">Ban Geçmişi</span>
				{player.bans.length ? (
					<BanHistory bans={player.bans} />
				) : (
					<div className="flex justify-center py-6">
						<span>Hiçbir kalıcı ban bulunamadı.</span>
					</div>
				)}
			</div>
		</div>
	);
}

type RoletimeChartProps = {
	roletime: NonNullablePlayer['roletime'];
};

const tooltipFormatter = (value: number) => [value.toString().replace('.', ','), ''];

function RoletimeChart({ roletime }: RoletimeChartProps) {
	const [chartWidth, setChartWidth] = useState(800);
	const [maxBars, setMaxBars] = useState(20);
	const [inputInvalid, setInputInvalid] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);

	const [chartOptions, setChartOptions] = useState({
		jobs: true,
		nonRole: false,
		trait: true,
		spawner: false,
		ghost: false,
		antagonists: false,
	});

	const chartRef = useRef<HTMLDivElement>(null);

	const filterJob = useCallback((
		job: NonNullablePlayer['roletime'][number]['job'],
		options: typeof chartOptions
	) => !(
		(!options.nonRole && non_roles.includes(job)) ||
		(!options.trait && trait_roles.includes(job)) ||
		(!options.spawner && spawner_roles.includes(job)) ||
		(!options.ghost && ghost_roles.includes(job)) ||
		(!options.antagonists && antagonist_roles.includes(job)) ||
		(!options.jobs && !all_roles.includes(job))
	), []);

	const roletimeFilter = useCallback(({ job }: { job: string }) => filterJob(job, chartOptions), [filterJob, chartOptions]);

	const onCheckboxChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = event.target;

		const trySet = (options: typeof chartOptions) => {
			if (roletime.filter(({ job }) => filterJob(job, options)).length) {
				setChartOptions(options);
			}
		};

		switch (name) {
			case 'jobs':
				trySet({ ...chartOptions, jobs: checked });
				break;
			case 'trait':
				trySet({ ...chartOptions, trait: checked });
				break;
			case 'ghost':
				trySet({ ...chartOptions, ghost: checked });
				break;
			case 'spawner':
				trySet({ ...chartOptions, spawner: checked });
				break;
			case 'antagonists':
				trySet({ ...chartOptions, antagonists: checked });
				break;
			case 'other':
				trySet({ ...chartOptions, nonRole: checked });
				break;
		}
	}, [roletime, filterJob, chartOptions]);

	const filteredRoletime = useMemo(() => roletime.filter(roletimeFilter).map(({ job, minutes }) => ({ job, hours: Math.floor(minutes / 6) / 10, })), [roletime, roletimeFilter]);
	const visibleRoletime = useMemo(() => filteredRoletime.slice(0, maxBars), [filteredRoletime, maxBars]);

	const onInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		let value: string | number = event.target.value;

		if (!value) {
			event.target.value = '1';
		} else if (value.startsWith('0') && Number(value) !== 0) {
			event.target.value = String(Number(value));
		}

		value = Number(event.target.value);

		if (value >= 1 && value <= filteredRoletime.length) {
			setMaxBars(value);
			setInputInvalid(false);
		} else {
			setInputInvalid(true);
		}
	}, [filteredRoletime]);

	useResize((entries) => {
		const { width } = entries[0].contentRect;
		setChartWidth(width);
	}, chartRef);

	useEffect(() => {
		if (inputRef.current) {
			const value = Number(inputRef.current.value);

			if (value >= 1 && value <= filteredRoletime.length) {
				setInputInvalid(false);
			} else {
				setInputInvalid(true);
			}
		}
	}, [filteredRoletime]);

	return (
		<>
			{/* responsive container shit does not work as documented so i needed a workaround */}
			<ResponsiveContainer ref={chartRef} width="100%" height={400} style={{ position: 'relative', left: -22 }}>
				<BarChart width={chartWidth} height={400} data={visibleRoletime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
					<XAxis dataKey="job" padding={{ left: 5, right: 5 }} />
					<YAxis padding={{ bottom: 5 }} allowDecimals={false} />
					<Tooltip cursor={{ opacity: 0.1 }} separator="" formatter={tooltipFormatter} contentStyle={{ background: 'transparent', border: 'none' }} itemStyle={{ color: 'rgb(100 116 139)' }} />
					<Bar dataKey="hours" fill="#dc2626" unit=" saat" />
				</BarChart>
			</ResponsiveContainer>
			<div className="flex flex-wrap items-center justify-center gap-4 [&>div]:flex [&>div]:items-center [&>div]:gap-2">
				<div>
					<span>Meslekler</span>
					<input name="jobs" type="checkbox" checked={chartOptions.jobs} onChange={onCheckboxChange} />
				</div>
				<div>
					<span>Station Trait</span>
					<input name="trait" type="checkbox" checked={chartOptions.trait} onChange={onCheckboxChange} />
				</div>
				<div>
					<span>Ghost Offer</span>
					<input name="ghost" type="checkbox" checked={chartOptions.ghost} onChange={onCheckboxChange} />
				</div>
				<div>
					<span>Spawner</span>
					<input name="spawner" type="checkbox" checked={chartOptions.spawner} onChange={onCheckboxChange} />
				</div>
				<div>
					<span>Antagonist</span>
					<input name="antagonists" type="checkbox" checked={chartOptions.antagonists} onChange={onCheckboxChange} />
				</div>
				<div>
					<span>Diğer</span>
					<input name="other" type="checkbox" checked={chartOptions.nonRole} onChange={onCheckboxChange} />
				</div>
			</div>
			<NumberInput ref={inputRef} className="pb-4" style={{ opacity: inputInvalid ? 0.7 : 1 }} title="Gösterilen sütun sayısı" onChange={onInputChange} defaultValue={maxBars} min={1} max={999} />
		</>
	);
}

type ActivityChartProps = {
	activity: NonNullablePlayer['activity'];
};

function ActivityChart({ activity }: ActivityChartProps) {
	const [chartWidth, setChartWidth] = useState(800);

	const chartRef = useRef<HTMLDivElement>(null);

	const data = useMemo(() => {
		const activityClone = [...activity];
		const days: { date: string; rounds: number }[] = [];
		const firstDay = dayjs().subtract(180, 'day').startOf('day');

		for (let i = 0; i < 180; i++) {
			const day = firstDay.add(i, 'day').format('YYYY-MM-DD');
			days.push({ date: day, rounds: activityClone.find(([date]) => date === day)?.[1] ?? 0 });
		}

		return days;
	}, [activity]);

	useResize((entries) => {
		const { width } = entries[0].contentRect;
		setChartWidth(width);
	}, chartRef);

	return (
		<ResponsiveContainer ref={chartRef} width="100%" height={400} style={{ position: 'relative', left: -22 }}>
			<LineChart width={chartWidth} height={400} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
				<XAxis dataKey="date" tick={false} padding={{ left: 5, right: 5 }} />
				<YAxis padding={{ bottom: 5 }} domain={[0, 24]} />
				<Tooltip cursor={{ opacity: 0.1 }} separator="" formatter={tooltipFormatter} contentStyle={{ background: 'transparent', border: 'none' }} itemStyle={{ color: 'rgb(100 116 139)' }} />
				<Line type="monotone" dataKey="rounds" unit=" round" dot={false} />
			</LineChart>
		</ResponsiveContainer>
	);
}

type BanHistoryProps = {
	bans: NonNullablePlayer['bans'];
};

function BanHistory({ bans }: BanHistoryProps) {
	const [currentBan, setCurrentBan] = useState(1);

	const fitView = useCallback(() => {
		setTimeout(() => {
			document.getElementById('bans-navigation')?.scrollIntoView({
				block: 'end',
				inline: 'nearest',
				behavior: 'smooth',
			});
		}, 1);
	}, []);

	const onInputChange = useCallback( (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = Number(event.target.value);

		if (value >= 1 && value <= bans.length) {
			setCurrentBan(value);
			fitView();
		}
	}, [bans.length, fitView]);

	const onPreviousClick = useCallback(() => {
		setCurrentBan((current) => Math.max(current - 1, 1));
		fitView();
	}, [fitView]);

	const onNextClick = useCallback(() => {
		setCurrentBan((current) => Math.min(current + 1, bans.length));
		fitView();
	}, [bans.length, fitView]);

	const ban = bans[bans.length - currentBan];

	return (
		<>
			<div className="max-w-md flex flex-col items-center gap-2 p-4 [&>span:nth-child(odd)]:text-gray-500">
				<span>Round</span>
				<span>{ban.round_id ?? '—'}</span>
				<span>Tarih</span>
				<span title={`${relativeTime(ban.bantime, undefined)} önce`}>{ban.bantime}</span>
				<span>Süre</span>
				<span>{ban.expiration_time ? relativeTime(ban.bantime, ban.expiration_time) : 'Kalıcı'}</span>
				<span>Admin</span>
				<span><Link href={`/players/${ban.a_ckey}`}>{ban.a_ckey}</Link></span>
				<span>Kaldırıldığı Tarih</span>
				{ban.unbanned_datetime ? <span title={`${relativeTime(ban.bantime, ban.unbanned_datetime)} sonra`}>{ban.unbanned_datetime}</span> : <span>—</span>}
				<span>Kaldıran Admin</span>
				<span>{ban.unbanned_ckey ? <Link href={`/players/${ban.unbanned_ckey}`}>{ban.unbanned_ckey}</Link> : '—'}</span>
				<span>Roller</span>
				<span className="text-center">{ban.roles ?? '—'}</span>
				<span>Sebep</span>
				<span className="text-center">{ban.reason}</span>
			</div>
			<div className="[&>span]:cursor-pointer [&>span]:px-2">
				<span onClick={onPreviousClick}><Icon icon={faAngleLeft} /></span>
				<div className="inline-flex flex-row items-center">
					<NumberInput value={currentBan} min={1} max={bans.length} onChange={onInputChange} />
					<span className="cursor-default">/</span>
					<NumberInput value={bans.length} disabled min={1} max={bans.length} />
				</div>
				<span onClick={onNextClick}><Icon icon={faAngleRight} /></span>
				<div id="bans-navigation" className="relative top-6"></div>
			</div>
		</>
	);
}
