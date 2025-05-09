import {ceil, chain, forEach, isEqual, map} from 'lodash';
import {fromContract} from './budgetContractMapper';
import {currentYearBudget, prevYearBudget} from './functions';


export const budgetSummaryData = (budgets, year) => {
    const getBudgetedValue = (budget, itemName) => {
        let revenue = 0;
        if (!isEqual(budget, undefined)) {
            const revenueIncome = chain(fromContract(budget).items)
                .filter((e) => e.majorHeadGroup === itemName)
                .first()
                .value();
            revenue = !!revenueIncome ? revenueIncome.summary.budgetedAmount : 0;
        }
        return revenue;
    };

    const getRevisedValue = (budget, itemName) => {
        let revenue = 0;
        if (!isEqual(budget, undefined)) {
            const revenueIncome = chain(fromContract(budget).items)
                .filter((e) => e.majorHeadGroup === itemName)
                .first()
                .value();
            revenue = !!revenueIncome ? ceil(revenueIncome.summary.eightMonthsActuals + revenueIncome.summary.fourMonthsProbables) : 0;
        }
        return revenue;
    };


    const getBudgetSummaryTableHeadings = () => {
        let headings = [];
        headings.push('');
        headings.push(`FY ${year.substring(0, 4) - 1} - ${year.substring(7, 5) - 1} (Revised Estimates)`);
        headings.push(`FY ${year} (Budgeted Estimates)`);
        return headings;
    };

    const getBudgetedTotalSurplusOrDef = () => {
        return (getBudgetedValue(currentYearBudget(budgets, year), 'Revenue Receipt') + getBudgetedValue(currentYearBudget(budgets, year), "Liability (Capital Income)")) - (getBudgetedValue(currentYearBudget(budgets, year), 'Expenses') + getBudgetedValue(currentYearBudget(budgets, year), "Assets (Capital Expenditure)"));
    };
    const getRevisedTotalSurplusOrDef = () => {
        return (getRevisedValue(prevYearBudget(budgets, year), 'Revenue Receipt') + getRevisedValue(prevYearBudget(budgets, year), "Liability (Capital Income)")) - (getRevisedValue(prevYearBudget(budgets, year), 'Expenses') + getRevisedValue(prevYearBudget(budgets, year), "Assets (Capital Expenditure)"));
    };
    const getPrevYearOpeningBalance = () => {
        if (prevYearBudget(budgets, year)) {
            return prevYearBudget(budgets, year).openingBalance;
        }
    };
    const getCurrentYearOpeningBalance = () => {
        if (currentYearBudget(budgets, year)) {
            return currentYearBudget(budgets, year).openingBalance;

        }
    };

    const getBudgetSummaryTableData = () => {
        let dataLine = [];
        const pushInArray = (array, name, revised, budgeted) => {
            array.push({
                name: name, revised: ceil(revised / 100000), budgeted: ceil(budgeted / 100000)
            });
        };
        pushInArray(dataLine, 'Opening Balance', getPrevYearOpeningBalance(), getCurrentYearOpeningBalance());
        pushInArray(dataLine, 'Revenue Income', getRevisedValue(prevYearBudget(budgets, year), 'Revenue Receipt'), getBudgetedValue(currentYearBudget(budgets, year), 'Revenue Receipt'));
        pushInArray(dataLine, 'Revenue Expenditure', getRevisedValue(prevYearBudget(budgets, year), 'Expenses'), getBudgetedValue(currentYearBudget(budgets, year), 'Expenses'));
        pushInArray(dataLine, 'Capital Income', getRevisedValue(prevYearBudget(budgets, year), "Liability (Capital Income)"), getBudgetedValue(currentYearBudget(budgets, year), "Liability (Capital Income)"));
        pushInArray(dataLine, 'Capital Expenditure', getRevisedValue(prevYearBudget(budgets, year), "Assets (Capital Expenditure)"), getBudgetedValue(currentYearBudget(budgets, year), "Assets (Capital Expenditure)"));
        pushInArray(dataLine, 'Total surplus/deficit', getRevisedTotalSurplusOrDef(prevYearBudget(budgets, year)), getBudgetedTotalSurplusOrDef(currentYearBudget(budgets, year)));
        return dataLine;
    };
    const piechartData = () => {
        let pieData = [];
        pieData.push({
            id: 'Revenue Budget', value: ceil(getBudgetedValue(currentYearBudget(budgets, year), 'Expenses') / 100000)
        });
        pieData.push({
            id: 'Capital Budget',
            value: ceil(getBudgetedValue(currentYearBudget(budgets, year), "Liability (Capital Income)") / 100000)
        });
        return pieData;
    };
    const getBarGraphData = () => {
        let barData = [];
        barData.push({
            'name': 'Revenue Income',
            'Revenue Income': ceil(getBudgetedValue(currentYearBudget(budgets, year), 'Revenue Receipt') / 100000)
        });
        barData.push({
            'name': 'Revenue Expenditure',
            'Revenue Expenditure': ceil(getBudgetedValue(currentYearBudget(budgets, year), 'Expenses') / 100000)
        });
        return barData;
    };
    const getPopulation = () => {
        if (currentYearBudget(budgets, year)) {
            return currentYearBudget(budgets, year).population;
        }
        return 0;
    };

    return {
        budgetSummaryTableHeadings: getBudgetSummaryTableHeadings(),
        budgetSummaryTableData: getBudgetSummaryTableData(),
        pieChartData: piechartData(),
        barGraphData: getBarGraphData(),
        budgetedRevenueIncome: getBudgetedValue(currentYearBudget(budgets, year), 'Revenue Receipt'),
        budgetedRevenueExpenditure: getBudgetedValue(currentYearBudget(budgets, year), 'Expenses'),
        budgetedCapitalExpenditure: getBudgetedValue(currentYearBudget(budgets, year), "Assets (Capital Expenditure)"),
        population: getPopulation()

    };
};

export const revenueIncomeAndExpenditureSummaryData = (budgets, year) => {
    const getValue = (category) => {
        if (currentYearBudget(budgets, year)) {
            return chain(currentYearBudget(budgets, year).budgetLines)
                .filter((e) => e.minorHeadCategory === category)
                .sumBy((e) => e.budgetedAmount)
                .value();
        }
    };
    const dataLines = [];
    const revenueIncomeCategories = ['Revenue Grants', 'Own Tax', 'Non Tax'];
    dataLines.push({
        sr: 'A', name: 'Revenue Income', unit: '(In lakhs)'
    });
    let totalRevenueIncome = 0;
    forEach(revenueIncomeCategories, category => {
        totalRevenueIncome += getValue(category);
        dataLines.push({
            sr: '', name: category, amount: ceil(getValue(category) / 100000)
        });
    });

    const pushDataInArray = (array, sr, col1, col2) => {
        array.push({
            sr: sr, name: col1, amount: col2
        });
    };

    pushDataInArray(dataLines, '', 'Total Revenue Income', ceil(totalRevenueIncome / 100000));
    pushDataInArray(dataLines, 'B', 'Revenue Expenditure', '(In lakhs)');
    pushDataInArray(dataLines, '', 'Admin Expenses', ceil(getValue('Administrative Expense') / 100000));
    pushDataInArray(dataLines, '', 'Establishment Expenses', ceil(getValue('Salary and allowances') / 100000));
    pushDataInArray(dataLines, '', 'Operations & Maintenance', ceil((getValue('Operations and Maintenance') + getValue('Water Supply (Public Health and Welfare)')) / 100000));
    pushDataInArray(dataLines, '', 'Others', ceil((getValue('Others') + getValue('Social Welfare')) / 100000));
    pushDataInArray(dataLines, '', 'Total Revenue Expenditure', ceil((getValue('Others') + getValue('Social Welfare') + getValue('Operations and Maintenance') + getValue('Water Supply (Public Health and Welfare)') + getValue('Salary and allowances') + getValue('Administrative Expense')) / 100000));

    return {
        data: dataLines
    };
};

export const getRevenueIncomeSummaryData = (budgets, year) => {
    const getValueFromCategory = (category) => {
        if (currentYearBudget(budgets, year)) {
            return chain(currentYearBudget(budgets, year).budgetLines)
                .filter((e) => e.minorHeadCategory === category)
                .sumBy((e) => e.budgetedAmount)
                .value();
        }
    };
    const getValueFromMajorHead = (majorHead) => {
        if (currentYearBudget(budgets, year)) {
            return chain(currentYearBudget(budgets, year).budgetLines)
                .filter((e) => e.majorHead === majorHead)
                .sumBy((e) => e.budgetedAmount)
                .value();
        }
    };
    const getValueFromMinorHead = (minorHead) => {
        if (currentYearBudget(budgets, year)) {
            return chain(currentYearBudget(budgets, year).budgetLines)
                .filter((e) => e.minorHead === minorHead)
                .sumBy((e) => e.budgetedAmount)
                .value();
        }
    };

    let headers = ['', 'Revenue Income', '(In lakhs)'];
    let dataLines = [];
    const pushDataInArray = (array, sr, col1, col2) => {
        array.push({
            sr: sr, name: col1, amount: col2
        });
    };
    const getTotalRevenueIncome = () => {
        return getValueFromCategory('Revenue Grants') +
            getValueFromMajorHead('Fees,User Charges & Fines') +
            getValueFromMinorHead('Consolidated Tax on Property') +
            getValueFromMinorHead('Advertisement Tax') +
            getValueFromMinorHead('Tax on Performance & Shows') +
            getValueFromMinorHead('Cess on Entry of Goods') +
            getValueFromMinorHead('Toll / Entry tax') +
            getValueFromMinorHead('Other Taxes') +
            getValueFromCategory('Reserves') +
            getValueFromCategory('Sales and Hire Charges') +
            getValueFromCategory('Income from Interest') +
            getValueFromMajorHead('Assigned Revenues & Compensations') +
            getValueFromMajorHead('Other Income') +
            getValueFromMajorHead('Deposits Forfeited/Non Refundable Deposits etc.') +
            getValueFromMajorHead('Rental Income from Municipal Properties');
    };


    pushDataInArray(dataLines, 'A', 'Revenue Grants', ceil(getValueFromCategory('Revenue Grants') / 100000));
    pushDataInArray(dataLines, 'B', 'Own Tax Income', '');
    pushDataInArray(dataLines, '', 'Property Tax', ceil(getValueFromMinorHead('Consolidated Tax on Property') / 100000));
    pushDataInArray(dataLines, '', 'Water Tax', '');//todo requirements not clear
    pushDataInArray(dataLines, '', 'Others(Sanitation tax, SWM, Advertisement tax, Cinema tax etc.)',
        ceil((getValueFromMinorHead('Advertisement Tax') +
            getValueFromMinorHead('Tax on Performance & Shows') +
            getValueFromMinorHead('Cess on Entry of Goods') +
            getValueFromMinorHead('Toll / Entry tax') +
            getValueFromMinorHead('Other Taxes')) / 100000));
    pushDataInArray(dataLines, 'C', 'Non Tax Income', '');


    pushDataInArray(dataLines, '', 'Fees & User Charges', ceil(getValueFromMajorHead('Fees,User Charges & Fines') / 100000));
    pushDataInArray(dataLines, '', 'Reserve Funds', ceil(getValueFromCategory('Reserves') / 100000));
    pushDataInArray(dataLines, '', 'Other Non-Tax Income (sales & interest)',
        ceil((getValueFromCategory('Sales and Hire Charges') +
            getValueFromCategory('Income from Interest') +
            getValueFromMajorHead('Assigned Revenues & Compensations') +
            getValueFromMajorHead('Other Income') +
            getValueFromMajorHead('Deposits Forfeited/Non Refundable Deposits etc.')) / 100000));
    pushDataInArray(dataLines, '', 'Rental Income', ceil(getValueFromMajorHead('Rental Income from Municipal Properties') / 100000));
    pushDataInArray(dataLines, '', 'Total Revenue Income', ceil(getTotalRevenueIncome() / 100000));

    const pieChartData = () => {
        let pieData = [];
        pieData.push({id: 'Revenue Grants', value: ceil(getValueFromCategory('Revenue Grants') / 100000)});
        pieData.push({id: 'Own-Tax Income', value: ceil(getValueFromCategory('Own Tax') / 100000)});
        pieData.push({id: 'Non-Tax Income', value: ceil(getValueFromCategory('Non Tax') / 100000)});
        return pieData;
    };

    return {
        headers, data: dataLines, pieChartData: pieChartData()
    };
};


const linesForMajorHeadGroup = (budget, key) => budget.budgetLines.filter(line => line.majorHeadGroup === key);
const inLakhs = (number) => ceil(number / 100000);
const getSum = (budget, key) => inLakhs(linesForMajorHeadGroup(budget, key).reduce((acc, item) => acc + item.budgetedAmount, 0));
export const summaryData = (budgets) => {
    return map(budgets, budget => ({
        budgetYear: budget.budgetYear,
        'Revenue Income': getSum(budget, 'Revenue Receipt'),
        'Revenue Expenditure': getSum(budget, 'Expenses'),
        'Capital Income': getSum(budget, "Liability (Capital Income)"),
        'Capital Expenditure': getSum(budget, "Assets (Capital Expenditure)")
    }));
};

export const getMajorCapitalItems = (budgets, year) => {
    const budget = currentYearBudget(budgets, year);
    if (!budget) {
        return {
            capitalIncome: [],
            capitalExpenditure: []
        }
    }
    const topNItems = (key, n) => chain(linesForMajorHeadGroup(budget, key))
        .sortBy('budgetedAmount')
        .reverse()
        .take(n)
        .value();
    return {
        capitalExpenditure: topNItems("Assets (Capital Expenditure)", 10),
        capitalIncome: topNItems("Liability (Capital Income)", 8)
    }
}

export const capitalBudgetSummaryData = (budgets, year) => {
    const getDataFromMajorHeadGroup = (majorHeadGroupName) => {
        if (currentYearBudget(budgets, year)) {
            return chain(currentYearBudget(budgets, year).budgetLines)
                .filter((line) => line.majorHeadGroup === majorHeadGroupName)
                .sumBy((line) => line.budgetedAmount)
                .value();
        }
    };
    const getValueFromCategory = (category) => {
        if (currentYearBudget(budgets, year)) {
            return chain(currentYearBudget(budgets, year).budgetLines)
                .filter((e) => e.minorHeadCategory === category)
                .sumBy((e) => e.budgetedAmount)
                .value();
        }
    };

    const getValueFromMajorHead = (majorHead) => {
        if (currentYearBudget(budgets, year)) {
            return chain(currentYearBudget(budgets, year).budgetLines)
                .filter((e) => e.majorHead === majorHead)
                .sumBy((e) => e.budgetedAmount)
                .value();
        }
    };

    const getBarGraphData = () => {
        let barData = [];
        barData.push({
            'name': 'Capital Income', 'Capital Income': ceil(getDataFromMajorHeadGroup("Liability (Capital Income)") / 100000)
        });
        barData.push({
            'name': 'Capital Expenditure',
            'Capital Expenditure': ceil(getDataFromMajorHeadGroup("Assets (Capital Expenditure)") / 100000)
        });
        return barData;
    };

    let tableRows = [];
    const pushDataInArray = (array, sr, name, data) => {
        array.push({
            sr: sr, name: name, data: data
        });
    };
    pushDataInArray(tableRows, 'A', 'Capital Income (INR lakhs)', '');
    pushDataInArray(tableRows, '', 'Central State Schemes & Grants', ceil(getValueFromCategory('Central, State Schemes and Grants') / 100000));
    pushDataInArray(tableRows, '', 'Deposits', ceil(getValueFromCategory('Loans, Advances and Deposits') / 100000));
    pushDataInArray(tableRows, '', 'Recovery', ceil(getValueFromCategory('Recovery ') / 100000));
    pushDataInArray(tableRows, 'B', 'Capital Expenditure (INR lakhs)', '');
    pushDataInArray(tableRows, '', 'Capital Projects', ceil(getValueFromCategory('Capital Budgeted Expenses ') / 100000));
    pushDataInArray(tableRows, '', 'Loan, Advance and Deposit Repayment', ceil(getValueFromMajorHead('Loans , Advances and Deposits') / 100000));

    return {
        barGraphData: getBarGraphData(), tableRows
    };
};

