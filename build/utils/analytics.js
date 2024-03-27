"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLast12MonthsData = void 0;
async function generateLast12MonthsData(model) {
    // Initialize an empty array to store data for the last 12 months
    const last12Months = [];
    // Get the current date
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    // Loop through the last 12 months
    for (let i = 11; i >= 0; i--) {
        // Calculate the start and end dates for the current month
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i * 28);
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 28);
        // Format the month and year for display
        const monthYear = endDate.toLocaleString('default', { day: "numeric", month: "short", year: "numeric" });
        // Query the database to count documents created within the current month
        const count = await model.countDocuments({
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        });
        // Add the month data to the array
        last12Months.push({ month: monthYear, count });
    }
    // Return the array containing data for the last 12 months
    return { last12Months };
}
exports.generateLast12MonthsData = generateLast12MonthsData;
