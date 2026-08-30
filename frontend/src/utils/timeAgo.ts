export function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'نامشخص';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'هم‌اکنون';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes.toLocaleString('fa-IR')} دقیقه پیش`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours.toLocaleString('fa-IR')} ساعت پیش`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'دیروز';
  if (diffInDays < 7) return `${diffInDays.toLocaleString('fa-IR')} روز پیش`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks.toLocaleString('fa-IR')} هفته پیش`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths.toLocaleString('fa-IR')} ماه پیش`;
  
  return new Date(dateString).toLocaleDateString('fa-IR');
}
