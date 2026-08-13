export type CustomRecurrence =
| {
  type: 'weekly';
  weekdays: number[]; // 0 is Sunday, 1 is Monday
}
| {
  type: 'monthly';
  monthDays: number[]; // 1 is first day of the month
};
