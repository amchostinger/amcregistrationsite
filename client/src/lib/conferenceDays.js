/**
 * lib/conferenceDays.js
 * The conference programme days, in one place.
 *
 * The public schedule and the admin schedule editor both read this list, so a
 * day that can be edited is always a day that is displayed. They previously
 * kept their own copies, which had drifted: the admin offered a seventh day
 * (15 March) the public page never rendered, and labelled every day with the
 * wrong weekday.
 */

export const CONFERENCE_DAYS = [
  { iso: '2027-03-09', label: 'Tue 9 Mar',  title: 'Arrival & Opening',           dressCode: null },
  { iso: '2027-03-10', label: 'Wed 10 Mar', title: 'Business Day I',              dressCode: null },
  { iso: '2027-03-11', label: 'Thu 11 Mar', title: "Women's Day",                 dressCode: 'All delegates wear BLACK' },
  { iso: '2027-03-12', label: 'Fri 12 Mar', title: 'Celebration of Diversity',    dressCode: 'Wear church material/logo' },
  { iso: '2027-03-13', label: 'Sat 13 Mar', title: 'African Culture Celebration', dressCode: 'Wear traditional attire of your country. Excursion after lunch' },
  { iso: '2027-03-14', label: 'Sun 14 Mar', title: 'Church Services',             dressCode: 'Wear church uniforms. Services around Harare' },
];

/** First and last programme day, for headings such as "March 9–14, 2027". */
export const FIRST_DAY = CONFERENCE_DAYS[0].iso;
export const LAST_DAY = CONFERENCE_DAYS[CONFERENCE_DAYS.length - 1].iso;

export const findDay = (iso) => CONFERENCE_DAYS.find((d) => d.iso === iso) || null;
