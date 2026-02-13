/**
 * Employee Master Migration Object
 *
 * Migrates Employee Master from ECC PA infotypes (IT0000-IT0041)
 * to S/4HANA HCM / SuccessFactors Employee Central.
 *
 * ~50 field mappings: 10 org assignment (IT0001) + 8 personal data (IT0002)
 * + 6 address (IT0006) + 8 payroll (IT0008) + 6 actions (IT0000) + 10 misc + 2 metadata.
 * Mock: 40 employees across 2 company codes, mix of departments.
 */

const BaseMigrationObject = require('./base-migration-object');

class EmployeeMasterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'EMPLOYEE_MASTER'; }
  get name() { return 'Employee Master'; }

  getFieldMappings() {
    return [
      // ── Org assignment (IT0001) — 10 ────────────────────────
      { source: 'PERNR', target: 'PersonnelNumber' },
      { source: 'BEGDA', target: 'StartDate', convert: 'toDate' },
      { source: 'ENDDA', target: 'EndDate', convert: 'toDate' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'WERKS', target: 'PersonnelArea' },
      { source: 'BTRTL', target: 'PersonnelSubArea' },
      { source: 'PERSG', target: 'EmployeeGroup' },
      { source: 'PERSK', target: 'EmployeeSubGroup' },
      { source: 'PLANS', target: 'Position' },
      { source: 'STELL', target: 'JobTitle' },

      // ── Org hierarchy — 3 ──────────────────────────────────
      { source: 'ORGEH', target: 'OrgUnit' },
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },

      // ── Personal data (IT0002) — 8 ─────────────────────────
      { source: 'NACHN', target: 'LastName' },
      { source: 'VORNA', target: 'FirstName' },
      { source: 'MIDNM', target: 'MiddleName' },
      { source: 'GESCH', target: 'Gender' },
      { source: 'GBDAT', target: 'DateOfBirth', convert: 'toDate' },
      { source: 'NATIO', target: 'Nationality' },
      { source: 'SPRSL', target: 'Language', convert: 'toUpperCase' },
      { source: 'ANRED', target: 'FormOfAddress' },

      // ── Communication (IT0105) — 3 ─────────────────────────
      { source: 'EMAIL', target: 'EmailAddress' },
      { source: 'USRID', target: 'UserID' },
      { source: 'TELNR', target: 'PhoneNumber' },

      // ── Address (IT0006) — 6 ───────────────────────────────
      { source: 'STRAS', target: 'Street' },
      { source: 'ORT01', target: 'City' },
      { source: 'PSTLZ', target: 'PostalCode' },
      { source: 'LAND1', target: 'Country', convert: 'toUpperCase' },
      { source: 'STATE', target: 'Region' },
      { source: 'LOESSION_CD', target: 'LocationCode' },

      // ── Payroll (IT0008) — 8 ───────────────────────────────
      { source: 'ABKRS', target: 'PayrollArea' },
      { source: 'TRFAR', target: 'PayScaleType' },
      { source: 'TRFGB', target: 'PayScaleArea' },
      { source: 'TRFGR', target: 'PayScaleGroup' },
      { source: 'TRFST', target: 'PayScaleLevel' },
      { source: 'WAESSION_RS', target: 'PayCurrency' },
      { source: 'BETRAG', target: 'PayAmount', convert: 'toDecimal' },
      { source: 'LGART', target: 'WageType' },

      // ── Time management (IT0007) — 3 ───────────────────────
      { source: 'DIVGV', target: 'WorkSchedule' },
      { source: 'CATEG', target: 'TimeManagementStatus' },
      { source: 'ZESSION_MOD', target: 'TimeRecordingVariant' },

      // ── Actions (IT0000) — 6 ───────────────────────────────
      { source: 'STAT2', target: 'EmploymentStatus' },
      { source: 'MASSN', target: 'ActionType' },
      { source: 'MASSG', target: 'ActionReason' },
      { source: 'EINDT', target: 'HireDate', convert: 'toDate' },
      { source: 'AUSTD', target: 'TerminationDate', convert: 'toDate' },
      { source: 'ENDDA_CONT', target: 'ContractEndDate', convert: 'toDate' },

      // ── Additional attributes — 5 ──────────────────────────
      { source: 'ANSVH', target: 'InsuranceType' },
      { source: 'BESSION_GRU', target: 'DisabilityGroup' },
      { source: 'FAMST', target: 'MaritalStatus' },
      { source: 'KONESSION_FS', target: 'Religion' },
      { source: 'SBESSION_GR', target: 'DisabilityDegree', convert: 'toInteger' },

      // ── Migration metadata ──────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'EMPLOYEE_MASTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['PersonnelNumber', 'LastName', 'FirstName', 'CompanyCode'],
      exactDuplicate: { keys: ['PersonnelNumber'] },
    };
  }

  _extractMock() {
    const records = [];

    const firstNames = [
      'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
      'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
      'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy',
      'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
      'Steven', 'Dorothy', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna',
    ];
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
      'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
      'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    ];

    const departments = [
      { orgUnit: '50001000', title: 'Software Engineer', group: 'IT', costCenter: 'CC1001' },
      { orgUnit: '50002000', title: 'Financial Analyst', group: 'FIN', costCenter: 'CC2001' },
      { orgUnit: '50003000', title: 'Sales Representative', group: 'SALES', costCenter: 'CC3001' },
      { orgUnit: '50004000', title: 'HR Specialist', group: 'HR', costCenter: 'CC4001' },
      { orgUnit: '50005000', title: 'Production Operator', group: 'PROD', costCenter: 'CC5001' },
      { orgUnit: '50006000', title: 'Quality Inspector', group: 'QA', costCenter: 'CC6001' },
      { orgUnit: '50007000', title: 'Logistics Coordinator', group: 'LOG', costCenter: 'CC7001' },
      { orgUnit: '50008000', title: 'Marketing Manager', group: 'MKT', costCenter: 'CC8001' },
    ];

    const cities = ['New York', 'Chicago', 'Los Angeles', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
    const states = ['NY', 'IL', 'CA', 'TX', 'AZ', 'PA', 'TX', 'CA'];
    const postalCodes = ['10001', '60601', '90001', '77001', '85001', '19101', '78201', '92101'];

    const payScaleGroups = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
    const payScaleLevels = ['01', '02', '03', '04', '05'];
    const genders = ['1', '2']; // 1 = Male, 2 = Female

    for (let i = 1; i <= 40; i++) {
      const dept = departments[(i - 1) % 8];
      const ci = (i - 1) % 8;
      const companyCode = i <= 25 ? '1000' : '2000';
      const persArea = i <= 25 ? '1000' : '2000';
      const gender = genders[(i - 1) % 2];
      const birthYear = 1960 + (i % 35);
      const birthMonth = String(1 + (i % 12)).padStart(2, '0');
      const hireYear = 2005 + (i % 18);
      const isTerminated = i % 20 === 0;

      records.push({
        PERNR: String(10000000 + i),
        BEGDA: `${hireYear}0101`,
        ENDDA: isTerminated ? `${hireYear + 5}0630` : '99991231',
        BUKRS: companyCode,
        WERKS: persArea,
        BTRTL: `${persArea.slice(-2)}01`,
        PERSG: i <= 30 ? '1' : '2', // Active, External
        PERSK: dept.group === 'PROD' ? 'U1' : 'S1', // Union vs Salaried
        PLANS: `POS${String(dept.orgUnit).slice(-4)}`,
        STELL: dept.title,
        ORGEH: dept.orgUnit,
        KOSTL: dept.costCenter,
        PRCTR: `PC${companyCode.slice(-2)}01`,
        NACHN: lastNames[i - 1],
        VORNA: firstNames[i - 1],
        MIDNM: i % 5 === 0 ? 'A' : '',
        GESCH: gender,
        GBDAT: `${birthYear}${birthMonth}15`,
        NATIO: 'US',
        SPRSL: 'EN',
        ANRED: gender === '1' ? 'Mr.' : 'Ms.',
        EMAIL: `${firstNames[i - 1].toLowerCase()}.${lastNames[i - 1].toLowerCase()}@company.com`,
        USRID: `${firstNames[i - 1].charAt(0)}${lastNames[i - 1]}`.toUpperCase().slice(0, 12),
        TELNR: `555-${String(1000 + i)}`,
        STRAS: `${100 + i} ${['Main St', 'Oak Ave', 'Elm Dr', 'Park Blvd', 'Cedar Ln', 'Pine Rd', 'Maple Way', 'Lake Dr'][ci]}`,
        ORT01: cities[ci],
        PSTLZ: postalCodes[ci],
        LAND1: 'US',
        STATE: states[ci],
        LOESSION_CD: '',
        ABKRS: companyCode === '1000' ? 'B1' : 'B2',
        TRFAR: '01',
        TRFGB: companyCode === '1000' ? '01' : '02',
        TRFGR: payScaleGroups[(i - 1) % 6],
        TRFST: payScaleLevels[(i - 1) % 5],
        WAESSION_RS: 'USD',
        BETRAG: String(40000 + (i * 1500) + ((i - 1) % 6) * 5000),
        LGART: '1000',
        DIVGV: 'NORM',
        CATEG: '1', // Clock times
        ZESSION_MOD: '',
        STAT2: isTerminated ? '0' : '3', // 0 = Withdrawn, 3 = Active
        MASSN: isTerminated ? 'Z2' : 'Z1', // Z1 = Hire, Z2 = Termination
        MASSG: isTerminated ? '03' : '01', // 01 = New Hire, 03 = Resignation
        EINDT: `${hireYear}0101`,
        AUSTD: isTerminated ? `${hireYear + 5}0630` : '',
        ENDDA_CONT: i % 10 === 0 ? `${hireYear + 2}1231` : '',
        ANSVH: '01',
        BESSION_GRU: '',
        FAMST: i % 3 === 0 ? '1' : i % 3 === 1 ? '2' : '0', // 0 = Single, 1 = Married, 2 = Divorced
        KONESSION_FS: '',
        SBESSION_GR: '',
      });
    }

    return records; // 40 employee records
  }
}

module.exports = EmployeeMasterMigrationObject;
