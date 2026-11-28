type CourseSuggestionSource = {
  level?: string;
  duration?: string;
  price?: string | number;
};

const uniqueValues = (values: (string | number | undefined)[]) =>
  [...new Set(values.map((value) => String(value ?? "").trim()))].filter(
    Boolean,
  );

export const getCourseInputSuggestions = (
  courses: CourseSuggestionSource[],
) => ({
  level: uniqueValues([
    ...courses.map((course) => course.level),
    "Cơ bản",
    "Trung cấp",
    "Nâng cao",
  ]).slice(0, 8),
  duration: uniqueValues([
    ...courses.map((course) => course.duration),
    "1 tháng",
    "3 tháng",
    "6 tháng",
    "12 tháng",
  ]).slice(0, 8),
  price: uniqueValues(courses.map((course) => course.price)).slice(0, 8),
});

export const formatCoursePriceSuggestion = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString("vi-VN")} ₫`
    : value;
};
