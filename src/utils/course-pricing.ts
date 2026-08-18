export interface CoursePricingLike {
	is_free?: number | string | null;
	price?: number | string | null;
}

/**
 * 课程免费状态以显式免费标记或零售价为准。
 * 兼容历史数据中 price 已为 0、但 is_free 尚未同步的记录。
 */
export const isCourseFree = (course: CoursePricingLike | null | undefined): boolean => {
	if (Number(course?.is_free) === 1) return true;

	const price = Number(course?.price);
	return Number.isFinite(price) && price <= 0;
};
