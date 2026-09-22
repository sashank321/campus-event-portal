import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { myRegistrationsRequest } from '../api/client';
import { registrationParams, registrationTabs, registrationSorts, registrationEmptyCopy, scanRegistrationDates, paginateRegistrations, dateBucket, recoverServerPage } from '../lib/registrations';
import { Skeleton, ErrorState, Pagination } from '../components/ui';
import { RegistrationCard, RegistrationTabs, RegistrationEmptyState, StudentHeader } from '../components/student/RegistrationCard';
import CancelRegistrationDialog from '../components/student/CancelRegistrationDialog';
import useCancelRegistration from '../features/student/useCancelRegistration';
import useStudentQuery from '../features/student/useStudentQuery';

const scanTabs = { upcoming: true, past: true };

export default function MyRegistrations() {
  const [search, setSearch] = useSearchParams();
  const params = registrationParams(search);
  const [pendingCancel, setPendingCancel] = useState(null);
  const cancel = useCancelRegistration();
  const scan = Boolean(scanTabs[params.tab]);
  const query = useStudentQuery({
    // Scans are independent of client-only sort, page, and page size changes.
    queryKey: scan
      ? ['own-registrations', 'dates', params.tab]
      : ['own-registrations', 'list', params.tab, params.sort, params.page, params.limit],
    queryFn: ({ signal }) => scan
      ? scanRegistrationDates(myRegistrationsRequest, params.tab, signal)
      : recoverServerPage(myRegistrationsRequest, params, signal),
  });

  function update(values) {
    setSearch((current) => {
      const next = new URLSearchParams(current);
      Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') next.delete(key);
        else next.set(key, String(value));
      });
      return next;
    });
  }

  const rows = useMemo(() => {
    if (!query.data) return null;
    if (scan) {
      const { items, complete, unknownDates } = query.data;
      const sorted = [...items].sort((a, b) => {
        const field = params.sort === 'newest' ? 'registeredAt' : null;
        const aTime = new Date(field ? a[field] : a.eventSnapshot?.startAt).getTime();
        const bTime = new Date(field ? b[field] : b.eventSnapshot?.startAt).getTime();
        return ((Number.isFinite(aTime) ? aTime : 0) - (Number.isFinite(bTime) ? bTime : 0)) * (params.sort === 'upcoming' ? 1 : -1);
      });
      const page = paginateRegistrations(sorted, params.page, params.limit);
      return { rows: page.data, meta: page.meta, complete, unknownDates };
    }
    const body = query.data;
    // An out-of-range URL page is recovered to the server's last real page;
    // show that page (and its pagination) rather than a false empty history.
    return { rows: body.data, meta: body.meta, complete: true, unknownDates: body.data.some((row) => dateBucket(row) === 'unknown') };
  }, [query.data, scan, params.sort, params.page, params.limit]);

  const emptyCopy = registrationEmptyCopy[params.tab];
  const limits = [...new Set([12, 24, 50, params.limit])].sort((a, b) => a - b);

  return <div className="container page">
    <StudentHeader eyebrow="MY EVENTS" title={<em>Your registrations.</em>}><Link className="button button-small button-secondary" to="/events">Explore events ↗</Link></StudentHeader>
    <RegistrationTabs tabs={Object.entries(registrationTabs)} active={params.tab} onSelect={(tab) => update({ tab, page: undefined })} />
    <div className="heading-actions">
      <label>Sort <select value={params.sort} onChange={(event) => update({ sort: event.target.value, page: undefined })}>{Object.entries(registrationSorts).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Per page <select value={params.limit} onChange={(event) => update({ limit: event.target.value, page: undefined })}>{limits.map((limit) => <option key={limit} value={limit}>{limit}</option>)}</select></label>
    </div>
    <p className="muted" role="note">Dates shown are registration snapshots and may differ from the current event schedule. The backend makes the final decision on cancellation eligibility.</p>
    {query.isPending ? <Skeleton /> : query.isError ? <ErrorState title="We couldn’t load your registrations." error={query.error} retry={query.refetch} />
      : rows && <>
        {!rows.complete && <p className="muted" role="note">This date scan reached its limit. Only part of your matching registrations is shown; sorting and page counts apply to that subset, not your full history. {params.tab === 'upcoming' ? 'Earlier upcoming events may be missing.' : 'More recent past events may be missing.'}</p>}
        {rows.unknownDates && <p className="muted" role="note">Some registrations have missing or invalid snapshot dates and cannot be placed in Upcoming or Past. Check All to find them.</p>}
        {!rows.rows.length ? <RegistrationEmptyState copy={!rows.complete ? 'No matching registrations were found in this partial scan.' : emptyCopy} />
          : <><div className="reg-grid">{rows.rows.map((registration) => <RegistrationCard key={registration._id} registration={registration} upcoming={params.tab === 'upcoming'} onCancel={setPendingCancel} cancelPending={cancel.isPending && pendingCancel?._id === registration._id} />)}</div>
            <Pagination meta={rows.meta} onPage={(page) => update({ page })} /></>}
      </>}
    {pendingCancel && !query.isPending && !query.isError && <CancelRegistrationDialog registration={{ registration: pendingCancel, onConfirm: (target) => cancel.mutateAsync({ id: target._id }) }} onClose={() => setPendingCancel(null)} />}
  </div>;
}
