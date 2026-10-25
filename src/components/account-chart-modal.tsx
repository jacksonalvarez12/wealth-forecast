import { useEffect, useId, useRef } from 'react';
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	type TooltipContentProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { AccountHistory, AccountHistoryPoint } from '../types/chart';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const currencyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	notation: 'compact',
	maximumFractionDigits: 1,
});

const formatMonth = (monthIndex: number) => `${MONTHS[monthIndex % 12]} ${Math.floor(monthIndex / 12)}`;

const formatMonthShort = (monthIndex: number) =>
	`${MONTHS[monthIndex % 12]} '${String(Math.floor(monthIndex / 12) % 100).padStart(2, '0')}`;

const formatSignedCurrency = (value: number) => `${value > 0 ? '+' : ''}${currencyFormatter.format(value)}`;

type ChartDatum = {
	monthIndex: number;
	value: number | null;
	actual: number | null;
	projected: number | null;
	point: AccountHistoryPoint;
};

// About six month labels at a fixed month interval, so they are evenly spaced
const pickMonthTicks = (first: number, last: number, maxTicks = 6): number[] => {
	const step = Math.max(1, Math.ceil((last - first) / (maxTicks - 1)));
	const ticks: number[] = [];
	for (let month = first; month <= last; month += step) {
		ticks.push(month);
	}
	return ticks;
};

// Evenly spaced y ticks on round numbers (1, 2, 2.5, 5 × 10ⁿ), always including $0
const pickValueTicks = (values: number[], targetCount = 4): number[] => {
	const min = Math.min(0, ...values);
	let max = Math.max(0, ...values);
	if (min === max) {
		max = 1;
	}
	const raw = (max - min) / targetCount;
	const magnitude = 10 ** Math.floor(Math.log10(raw));
	const normalized = raw / magnitude;
	const step =
		(normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;
	const ticks: number[] = [];
	for (let tick = Math.floor(min / step) * step; tick <= Math.ceil(max / step) * step + step / 2; tick += step) {
		ticks.push(tick);
	}
	return ticks;
};

const ChartTooltip = ({ active, payload }: TooltipContentProps<ValueType, NameType>) => {
	const datum = payload?.[0]?.payload as ChartDatum | undefined;
	if (!active || !datum) {
		return null;
	}

	return (
		<div className='chart-tooltip'>
			<p className='chart-tooltip__value'>
				{datum.value === null ? 'No balance' : currencyFormatter.format(datum.value)}
			</p>
			<p className='chart-tooltip__label'>
				{formatMonth(datum.monthIndex)}
				{datum.point.projected && ' · Projected'}
			</p>
		</div>
	);
};

export const AccountChartModal = (opts: { history: AccountHistory; onClose: () => void }) => {
	const { history, onClose } = opts;

	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();

	useEffect(() => {
		const dialog = dialogRef.current;
		if (dialog && !dialog.open) {
			dialog.showModal();
		}
	}, []);

	const { points } = history;
	const lastActualIndex = points.findLastIndex((p) => !p.projected);
	const hasProjected = points.some((p) => p.projected);

	// Actual and projected are separate series that share the boundary point, so the dashed line joins the solid one
	const data: ChartDatum[] = points.map((p, index) => ({
		monthIndex: p.monthIndex,
		value: p.value,
		actual: p.projected ? null : p.value,
		projected: p.projected || (hasProjected && index === lastActualIndex) ? p.value : null,
		point: p,
	}));

	const known = points.filter((p) => p.value !== null);
	const first = known[0];
	const last = known.at(-1);
	const change = first && last ? last.value! - first.value! : 0;

	const firstMonth = points[0]?.monthIndex;
	const lastMonth = points.at(-1)?.monthIndex;
	const showDots = data.length <= 1;
	const valueTicks = pickValueTicks(known.map((p) => p.value!));
	const monthTicks = firstMonth !== undefined && lastMonth !== undefined ? pickMonthTicks(firstMonth, lastMonth) : [];

	return (
		<dialog
			ref={dialogRef}
			className='modal'
			aria-labelledby={titleId}
			onClose={onClose}
			onClick={(e) => {
				// Clicks on the backdrop land on the dialog element itself
				if (e.target === e.currentTarget) {
					dialogRef.current?.close();
				}
			}}
		>
			<div className='modal__content'>
				<header className='modal__header'>
					<div>
						<h2
							id={titleId}
							className='modal__title'
						>
							{history.title}
						</h2>
						{firstMonth !== undefined && lastMonth !== undefined && (
							<p className='modal__subtitle'>
								{firstMonth === lastMonth
									? formatMonth(firstMonth)
									: `${formatMonth(firstMonth)} – ${formatMonth(lastMonth)}`}
							</p>
						)}
					</div>
					<button
						type='button'
						className='btn btn--ghost btn--icon'
						aria-label='Close'
						onClick={() => dialogRef.current?.close()}
					>
						<svg
							width='18'
							height='18'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							aria-hidden='true'
						>
							<path d='M18 6 6 18M6 6l12 12' />
						</svg>
					</button>
				</header>

				{first && last && (
					<dl className='stats'>
						<div className='stat'>
							<dt className='stat__label'>Start</dt>
							<dd className='stat__value'>{currencyFormatter.format(first.value!)}</dd>
						</div>
						<div className='stat'>
							<dt className='stat__label'>{last.projected ? 'End (projected)' : 'Latest'}</dt>
							<dd className='stat__value'>{currencyFormatter.format(last.value!)}</dd>
						</div>
						<div className='stat'>
							<dt className='stat__label'>Change</dt>
							<dd
								className={`stat__value ${change > 0 ? 'stat__value--up' : change < 0 ? 'stat__value--down' : ''}`}
							>
								{formatSignedCurrency(change)}
							</dd>
						</div>
					</dl>
				)}

				{hasProjected && (
					<div
						className='chart-key'
						aria-hidden='true'
					>
						<span className='chart-key__item'>
							<span className='chart-key__line' />
							Actual
						</span>
						<span className='chart-key__item'>
							<span className='chart-key__line chart-key__line--dashed' />
							Projected
						</span>
					</div>
				)}

				<div className='chart'>
					<ResponsiveContainer
						width='100%'
						height='100%'
					>
						<ComposedChart
							data={data}
							margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
						>
							<CartesianGrid
								vertical={false}
								stroke='var(--border)'
							/>
							<XAxis
								dataKey='monthIndex'
								type='number'
								domain={['dataMin', 'dataMax']}
								ticks={monthTicks}
								interval='preserveStartEnd'
								tickFormatter={formatMonthShort}
								tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
								tickLine={false}
								axisLine={{ stroke: 'var(--border-strong)' }}
								tickMargin={8}
								padding={{ left: 8, right: 8 }}
							/>
							<YAxis
								domain={[valueTicks[0], valueTicks.at(-1)!]}
								ticks={valueTicks}
								tickFormatter={(v: number) => compactCurrencyFormatter.format(v)}
								tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								width={64}
							/>
							<ReferenceLine
								y={0}
								stroke='var(--border-strong)'
							/>
							{hasProjected && lastActualIndex >= 0 && (
								<ReferenceLine
									x={data[lastActualIndex].monthIndex}
									stroke='var(--border-strong)'
								/>
							)}
							<Tooltip
								content={ChartTooltip}
								cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
								isAnimationActive={false}
							/>
							<Area
								dataKey='value'
								type='linear'
								baseValue={0}
								stroke='none'
								fill='var(--chart-line)'
								fillOpacity={0.1}
								activeDot={false}
								isAnimationActive={false}
							/>
							<Line
								dataKey='actual'
								type='linear'
								stroke='var(--chart-line)'
								strokeWidth={2}
								strokeLinecap='round'
								strokeLinejoin='round'
								dot={
									showDots && {
										r: 4,
										fill: 'var(--chart-line)',
										stroke: 'var(--surface)',
										strokeWidth: 2,
									}
								}
								activeDot={{
									r: 5,
									fill: 'var(--chart-line)',
									stroke: 'var(--surface)',
									strokeWidth: 2,
								}}
								isAnimationActive={false}
							/>
							{hasProjected && (
								<Line
									dataKey='projected'
									type='linear'
									stroke='var(--chart-line)'
									strokeWidth={2}
									strokeDasharray='6 5'
									strokeLinecap='round'
									dot={
										showDots && {
											r: 4,
											fill: 'var(--chart-line)',
											stroke: 'var(--surface)',
											strokeWidth: 2,
										}
									}
									activeDot={{
										r: 5,
										fill: 'var(--chart-line)',
										stroke: 'var(--surface)',
										strokeWidth: 2,
									}}
									isAnimationActive={false}
								/>
							)}
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</div>
		</dialog>
	);
};
