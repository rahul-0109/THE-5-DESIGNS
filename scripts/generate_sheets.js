const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Theme definition
const THEME = {
    obsidian: 'FF1A1A1A', // Obsidian Black
    gold: 'FFC5A059',     // Muted Gold
    beige: 'FFF5F5F0',    // Warm Beige
    beigeLight: 'FFFDFDFB', // Very light beige for alternating rows
    text: 'FF1A1A1A',
    textMuted: 'FF7F7F7F',
    border: 'FFE5E5E0',
    white: 'FFFFFFFF'
};

const SHEETS_DIR = path.join(__dirname, '..', 'data', 'sheets');
if (!fs.existsSync(SHEETS_DIR)) {
    fs.mkdirSync(SHEETS_DIR, { recursive: true });
}

// Helpers for excelJS cell styling
function applyHeaderStyle(cell, value, isSubtitle = false) {
    cell.value = value;
    cell.font = {
        name: 'Outfit',
        size: isSubtitle ? 11 : 16,
        bold: true,
        italic: !isSubtitle,
        color: { argb: isSubtitle ? THEME.gold : THEME.beige }
    };
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: THEME.obsidian }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

function applyTableHeaderStyle(cell, value) {
    cell.value = value;
    cell.font = {
        name: 'Outfit',
        size: 10,
        bold: true,
        color: { argb: THEME.beige }
    };
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: THEME.obsidian }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
        top: { style: 'thin', color: { argb: THEME.gold } },
        bottom: { style: 'medium', color: { argb: THEME.gold } },
        left: { style: 'thin', color: { argb: THEME.border } },
        right: { style: 'thin', color: { argb: THEME.border } }
    };
}

function applySubheadStyle(cell, value) {
    cell.value = value;
    cell.font = {
        name: 'Outfit',
        size: 11,
        bold: true,
        color: { argb: THEME.obsidian }
    };
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: THEME.beige }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
        top: { style: 'thin', color: { argb: THEME.gold } },
        bottom: { style: 'thin', color: { argb: THEME.gold } },
        left: { style: 'thin', color: { argb: THEME.border } },
        right: { style: 'thin', color: { argb: THEME.border } }
    };
}

function applyCellStyle(cell, options = {}) {
    cell.font = {
        name: 'Outfit',
        size: 10,
        bold: options.bold || false,
        italic: options.italic || false,
        color: { argb: options.color || THEME.text }
    };
    if (options.bg) {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: options.bg }
        };
    }
    cell.alignment = {
        vertical: 'middle',
        horizontal: options.align || 'left',
        wrapText: options.wrapText !== undefined ? options.wrapText : true
    };
    cell.border = {
        top: { style: options.borderTop || 'thin', color: { argb: options.borderColorTop || THEME.border } },
        bottom: { style: options.borderBottom || 'thin', color: { argb: options.borderColorBottom || THEME.border } },
        left: { style: 'thin', color: { argb: THEME.border } },
        right: { style: 'thin', color: { argb: THEME.border } }
    };

    if (options.numFormat) {
        cell.numFormat = options.numFormat;
    }
}

function configureSheet(ws, frozenRows = 5) {
    ws.views = [{
        state: 'frozen',
        ySplit: frozenRows,
        showGridLines: true
    }];
}

function autoFitColumns(ws, maxColumnWidths = {}) {
    ws.columns.forEach((col, idx) => {
        let maxLen = 0;
        col.eachCell({ includeEmpty: false }, cell => {
            // Ignore merged cells or headers in first few rows for length check
            if (cell.row <= 4 || cell.type === ExcelJS.ValueType.Formula) return;
            const strVal = cell.value ? String(cell.value) : '';
            if (strVal.length > maxLen) maxLen = strVal.length;
        });
        const colLetter = String.fromCharCode(65 + idx);
        col.width = Math.max(maxColumnWidths[colLetter] || 12, maxLen + 4);
    });
}

// ----------------------------------------------------
// 1. BOQ SHEET
// ----------------------------------------------------
async function generateBOQ() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Bill of Quantities');
    configureSheet(ws, 5);

    // Set Column Width defaults
    ws.columns = [
        { key: 'itemNo', width: 10 },
        { key: 'space', width: 22 },
        { key: 'desc', width: 45 },
        { key: 'specs', width: 45 },
        { key: 'qty', width: 12 },
        { key: 'unit', width: 10 },
        { key: 'rate', width: 16 },
        { key: 'amount', width: 18 },
        { key: 'remarks', width: 25 }
    ];

    // Main Header Block
    ws.mergeCells('A1:I2');
    applyHeaderStyle(ws.getCell('A1'), 'THE 5 DESIGNS');
    ws.mergeCells('A3:I3');
    applyHeaderStyle(ws.getCell('A3'), 'BILL OF QUANTITIES (BOQ)', true);
    
    ws.getRow(4).values = ['Project: Luxury Villa Penthouse', '', '', 'Client: Mr. & Mrs. Kapoor', '', '', 'Date: 2026-06-24', '', 'Status: Proposal V2'];
    for (let col = 1; col <= 9; col++) {
        applyCellStyle(ws.getCell(4, col), { bold: true, color: THEME.gold, align: 'center', bg: THEME.beige });
    }
    ws.mergeCells('A4:C4');
    ws.mergeCells('D4:F4');
    ws.mergeCells('G4:I4');

    // Headers
    const headers = ['Item No', 'Space/Area', 'Description of Works', 'Material Specifications', 'Quantity', 'Unit', 'Rate (INR)', 'Amount (INR)', 'Remarks'];
    ws.getRow(5).values = headers;
    ws.getRow(5).height = 26;
    for (let col = 1; col <= 9; col++) {
        applyTableHeaderStyle(ws.getCell(5, col), headers[col-1]);
    }

    const boqData = [
        { item: '1.0', space: 'CIVIL & DEMOLITION', desc: '', specs: '', qty: '', unit: '', rate: '', remarks: '', isHeader: true },
        { item: '1.1', space: 'Living Room', desc: 'Dismantling of existing floor tile and IPS base preparation', specs: 'Manual chipping, debris removal included', qty: 450, unit: 'Sft', rate: 45, remarks: 'To base concrete level' },
        { item: '1.2', space: 'Kitchen & Bath', desc: 'Waterproofing of wet areas with dual layer chemical coat', specs: 'Dr. Fixit waterproofing compound + cement slurry coating', qty: 2, unit: 'LS', rate: 35000, remarks: 'With 5 yr warranty' },
        { item: '2.0', space: 'FALSE CEILING & ELECTRICAL', desc: '', specs: '', qty: '', unit: '', rate: '', remarks: '', isHeader: true },
        { item: '2.1', space: 'All Areas', desc: 'Gypsum board false ceiling on G.I. suspension grid', specs: 'Saint Gobain Gypsum, perimeter channel & joint tapes', qty: 1800, unit: 'Sft', rate: 115, remarks: 'COB light grooves as per drawing' },
        { item: '2.2', space: 'All Areas', desc: 'Concealed wiring, electrical conduits and modular boxes', specs: 'Finolex FRLS wires, Polycab PVC conduits, metal boxes', qty: 1, unit: 'LS', rate: 145000, remarks: 'Switches in separate supply scope' },
        { item: '3.0', space: 'WOODWORK & PANELING', desc: '', specs: '', qty: '', unit: '', rate: '', remarks: '', isHeader: true },
        { item: '3.1', space: 'Master Bed', desc: 'Custom wardrobe with sliding doors and laminate carcass', specs: 'Greenply MR plywood, 1mm Century veneer exterior, Hettich channels', qty: 140, unit: 'Sft', rate: 1950, remarks: 'Handle-less profile design' },
        { item: '3.2', space: 'Living Area', desc: 'TV Backing wall paneling with veneer & metallic profile inlays', specs: 'HDHMR board core, natural walnut veneer, SS Gold T-profiles', qty: 120, unit: 'Sft', rate: 850, remarks: 'Walnut polish finish' },
        { item: '4.0', space: 'PAINTING & FINISHES', desc: '', specs: '', qty: '', unit: '', rate: '', remarks: '', isHeader: true },
        { item: '4.1', space: 'All Areas', desc: 'Wall putty preparation, primer & premium emulsion paint', specs: 'Asian Paints Royale Luxury Emulsion, 2 coats putty, 2 coats paint', qty: 5600, unit: 'Sft', rate: 48, remarks: 'Colors as per moodboard' }
    ];

    let rowIdx = 6;
    boqData.forEach(row => {
        const r = ws.getRow(rowIdx);
        r.height = row.isHeader ? 22 : 28;
        if (row.isHeader) {
            ws.mergeCells(`B${rowIdx}:I${rowIdx}`);
            ws.getCell(`A${rowIdx}`).value = row.item;
            applySubheadStyle(ws.getCell(`A${rowIdx}`), row.item);
            applySubheadStyle(ws.getCell(`B${rowIdx}`), row.space);
        } else {
            r.values = [
                row.item, row.space, row.desc, row.specs, row.qty, row.unit, row.rate,
                { formula: `E${rowIdx}*G${rowIdx}` },
                row.remarks
            ];
            const bgCol = rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white;
            applyCellStyle(ws.getCell(rowIdx, 1), { bg: bgCol, align: 'center' });
            applyCellStyle(ws.getCell(rowIdx, 2), { bg: bgCol });
            applyCellStyle(ws.getCell(rowIdx, 3), { bg: bgCol });
            applyCellStyle(ws.getCell(rowIdx, 4), { bg: bgCol });
            applyCellStyle(ws.getCell(rowIdx, 5), { bg: bgCol, align: 'right', numFormat: '#,##0.00' });
            applyCellStyle(ws.getCell(rowIdx, 6), { bg: bgCol, align: 'center' });
            applyCellStyle(ws.getCell(rowIdx, 7), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
            applyCellStyle(ws.getCell(rowIdx, 8), { bg: bgCol, align: 'right', bold: true, numFormat: '₹#,##0.00' });
            applyCellStyle(ws.getCell(rowIdx, 9), { bg: bgCol });
        }
        rowIdx++;
    });

    // Grand Total Row
    const totalRowIdx = rowIdx;
    ws.mergeCells(`A${totalRowIdx}:G${totalRowIdx}`);
    ws.getCell(`A${totalRowIdx}`).value = 'GRAND TOTAL ESTIMATE';
    applyCellStyle(ws.getCell(`A${totalRowIdx}`), { bold: true, align: 'right', color: THEME.obsidian, bg: THEME.beige });
    for (let col = 2; col <= 7; col++) {
        applyCellStyle(ws.getCell(totalRowIdx, col), { bg: THEME.beige });
    }
    
    ws.getCell(`H${totalRowIdx}`).value = { formula: `=SUM(H6:H${totalRowIdx-1})` };
    
    applyCellStyle(ws.getCell(totalRowIdx, 8), {
        bold: true,
        align: 'right',
        bg: THEME.gold,
        color: THEME.obsidian,
        numFormat: '₹#,##0.00',
        borderBottom: 'double',
        borderTop: 'medium',
        borderColorBottom: THEME.obsidian,
        borderColorTop: THEME.obsidian
    });
    
    applyCellStyle(ws.getCell(totalRowIdx, 9), { bg: THEME.beige });

    autoFitColumns(ws, { A: 10, E: 12, F: 10, G: 16, H: 18 });
    await wb.xlsx.writeFile(path.join(SHEETS_DIR, 'boq_template.xlsx'));
}

// ----------------------------------------------------
// 2. TIMELINE SHEET
// ----------------------------------------------------
async function generateTimeline() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Project Timeline');
    configureSheet(ws, 5);

    // Set columns including 12 Weeks (K to V)
    ws.columns = [
        { key: 'wbs', width: 10 },
        { key: 'task', width: 40 },
        { key: 'resp', width: 20 },
        { key: 'dep', width: 30 },
        { key: 'sourcing', width: 35 },
        { key: 'start', width: 12 },
        { key: 'end', width: 12 },
        { key: 'duration', width: 12 },
        { key: 'status', width: 12 },
        { key: 'progress', width: 12 },
        // Weeks
        { key: 'w1', width: 6 }, { key: 'w2', width: 6 }, { key: 'w3', width: 6 }, { key: 'w4', width: 6 },
        { key: 'w5', width: 6 }, { key: 'w6', width: 6 }, { key: 'w7', width: 6 }, { key: 'w8', width: 6 },
        { key: 'w9', width: 6 }, { key: 'w10', width: 6 }, { key: 'w11', width: 6 }, { key: 'w12', width: 6 }
    ];

    ws.mergeCells('A1:V2');
    applyHeaderStyle(ws.getCell('A1'), 'THE 5 DESIGNS');
    ws.mergeCells('A3:V3');
    applyHeaderStyle(ws.getCell('A3'), 'PHASE-BASED PROJECT TIMELINE & MATERIAL COMMITMENTS', true);

    ws.getRow(4).values = ['Project: Luxury Residence', '', '', 'Lead Designer: Rahul S.', '', '', 'Client: Kapoor Residence', '', '', 'Duration: 12 Weeks', '', '', 'Start: 2026-07-01', '', '', 'End: 2026-09-22', '', '', 'Status: Scheduled', '', '', ''];
    for (let col = 1; col <= 22; col++) {
        applyCellStyle(ws.getCell(4, col), { bold: true, color: THEME.gold, align: 'center', bg: THEME.beige });
    }
    ws.mergeCells('A4:C4');
    ws.mergeCells('D4:F4');
    ws.mergeCells('G4:I4');
    ws.mergeCells('J4:L4');
    ws.mergeCells('M4:O4');
    ws.mergeCells('P4:R4');
    ws.mergeCells('S4:V4');

    const headers = ['WBS No', 'Phase / Sub-Phase / Work Task', 'Responsible Party', 'Dependencies (Client/Team)', 'Sourcing Material Commitment', 'Start Date', 'End Date', 'Duration (Days)', 'Status', 'Progress (%)', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
    ws.getRow(5).values = headers;
    ws.getRow(5).height = 26;
    for (let col = 1; col <= 22; col++) {
        applyTableHeaderStyle(ws.getCell(5, col), headers[col-1]);
    }

    const timelineData = [
        { wbs: '1.0', task: 'PHASE 1: DESIGN & APPROVALS', resp: '', dep: '', sourcing: '', start: '2026-07-01', end: '2026-07-15', dur: 14, stat: 'In Progress', prog: 0.60, isPhase: true, wRange: [1, 2] },
        { wbs: '1.1', task: 'Sub-Phase: 3D Layout & Space Planning', resp: 'Designer', dep: 'Client brief approved', sourcing: 'N/A', start: '2026-07-01', end: '2026-07-08', dur: 7, stat: 'Completed', prog: 1.00, wRange: [1, 1] },
        { wbs: '1.2', task: 'Sub-Phase: Material Specifications Selection', resp: 'Sourcing Team', dep: 'Client 3D sign-off', sourcing: 'Marble catalogs, sample boards', start: '2026-07-09', end: '2026-07-15', dur: 6, stat: 'In Progress', prog: 0.30, wRange: [2, 2] },
        
        { wbs: '2.0', task: 'PHASE 2: CIVIL, WATERPROOFING & MEP SERVICES', resp: '', dep: '', sourcing: '', start: '2026-07-16', end: '2026-08-10', dur: 25, stat: 'Not Started', prog: 0.00, isPhase: true, wRange: [3, 6] },
        { wbs: '2.1', task: 'Sub-Phase: Civil Demolition & Layout Marking', resp: 'Civil Cont.', dep: 'Society NOC & layout finalization', sourcing: 'N/A', start: '2026-07-16', end: '2026-07-22', dur: 7, stat: 'Not Started', prog: 0.00, wRange: [3, 4] },
        { wbs: '2.2', task: 'Sub-Phase: Plumbing & Electrical Rough-Ins', resp: 'MEP Specialist', dep: 'Civil layouts completed', sourcing: 'Pipes & FR Cables committed: 2026-07-20', start: '2026-07-23', end: '2026-08-02', dur: 10, stat: 'Not Started', prog: 0.00, wRange: [4, 5] },
        { wbs: '2.3', task: 'Sub-Phase: Waterproofing & Floor IPS Leveling', resp: 'Civil Cont.', dep: 'Plumbing testing completed', sourcing: 'Chemical base supply committed: 2026-07-22', start: '2026-08-03', end: '2026-08-10', dur: 7, stat: 'Not Started', prog: 0.00, wRange: [5, 6] },

        { wbs: '3.0', task: 'PHASE 3: CEILING, JOINERY & SURFACE FINISHES', resp: '', dep: '', sourcing: '', start: '2026-08-11', end: '2026-09-22', dur: 42, stat: 'Not Started', prog: 0.00, isPhase: true, wRange: [7, 12] },
        { wbs: '3.1', task: 'Sub-Phase: Gypsum False Ceiling Suspension', resp: 'Ceiling Cont.', dep: 'MEP conduit check completed', sourcing: 'Saint Gobain Gypsum committed: 2026-08-08', start: '2026-08-11', end: '2026-08-20', dur: 9, stat: 'Not Started', prog: 0.00, wRange: [7, 8] },
        { wbs: '3.2', task: 'Sub-Phase: Wardrobes & Wall Paneling Carcass', resp: 'Carpenters', dep: 'Civil curing & ceilings complete', sourcing: 'Greenply MR Plywood committed: 2026-08-15', start: '2026-08-21', end: '2026-09-08', dur: 18, stat: 'Not Started', prog: 0.00, wRange: [8, 10] },
        { wbs: '3.3', task: 'Sub-Phase: Wall Primer, Putty & Veneer Polish', resp: 'Painting Team', dep: 'Carpentry carcass finished', sourcing: 'Paints & Melamine committed: 2026-09-05', start: '2026-09-09', end: '2026-09-18', dur: 9, stat: 'Not Started', prog: 0.00, wRange: [10, 11] },
        { wbs: '3.4', task: 'Sub-Phase: Electrical Fixtures & Handover', resp: 'PM / Sourcing', dep: 'Final paint coats completed', sourcing: 'COB lights & switches committed: 2026-09-10', start: '2026-09-19', end: '2026-09-22', dur: 4, stat: 'Not Started', prog: 0.00, wRange: [12, 12] }
    ];

    let rowIdx = 6;
    timelineData.forEach(row => {
        const r = ws.getRow(rowIdx);
        r.height = row.isPhase ? 22 : 28;

        if (row.isPhase) {
            ws.mergeCells(`B${rowIdx}:E${rowIdx}`);
            ws.getCell(`A${rowIdx}`).value = row.wbs;
            ws.getCell(`B${rowIdx}`).value = row.task;
            applySubheadStyle(ws.getCell(`A${rowIdx}`), row.wbs);
            applySubheadStyle(ws.getCell(`B${rowIdx}`), row.task);
            
            // Other details
            r.getCell(6).value = row.start;
            r.getCell(7).value = row.end;
            r.getCell(8).value = row.dur;
            r.getCell(9).value = row.stat;
            r.getCell(10).value = row.prog;

            applyCellStyle(r.getCell(6), { bold: true, align: 'center', bg: THEME.beige });
            applyCellStyle(r.getCell(7), { bold: true, align: 'center', bg: THEME.beige });
            applyCellStyle(r.getCell(8), { bold: true, align: 'right', bg: THEME.beige });
            applyCellStyle(r.getCell(9), { bold: true, align: 'center', bg: THEME.beige });
            applyCellStyle(r.getCell(10), { bold: true, align: 'right', numFormat: '0%', bg: THEME.beige });

        } else {
            r.values = [
                row.wbs, row.task, row.resp, row.dep, row.sourcing,
                row.start, row.end, row.dur, row.stat, row.prog
            ];
            const bgCol = rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white;
            applyCellStyle(r.getCell(1), { bg: bgCol, align: 'center' });
            applyCellStyle(r.getCell(2), { bg: bgCol });
            applyCellStyle(r.getCell(3), { bg: bgCol });
            applyCellStyle(r.getCell(4), { bg: bgCol });
            applyCellStyle(r.getCell(5), { bg: bgCol, italic: true });
            applyCellStyle(r.getCell(6), { bg: bgCol, align: 'center' });
            applyCellStyle(r.getCell(7), { bg: bgCol, align: 'center' });
            applyCellStyle(r.getCell(8), { bg: bgCol, align: 'right' });
            applyCellStyle(r.getCell(9), { bg: bgCol, align: 'center', bold: true });
            applyCellStyle(r.getCell(10), { bg: bgCol, align: 'right', numFormat: '0%' });
        }

        // Apply visual Gantt block in W1 to W12
        for (let w = 1; w <= 12; w++) {
            const cell = r.getCell(10 + w);
            if (row.wRange && w >= row.wRange[0] && w <= row.wRange[1]) {
                const fillCol = row.isPhase ? THEME.obsidian : THEME.gold;
                applyCellStyle(cell, { bg: fillCol });
                cell.value = ' ';
            } else {
                applyCellStyle(cell, { bg: row.isPhase ? THEME.beige : (rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white) });
            }
        }

        rowIdx++;
    });

    autoFitColumns(ws, { A: 10, B: 40, C: 20, D: 30, E: 35, F: 12, G: 12, H: 12 });
    await wb.xlsx.writeFile(path.join(SHEETS_DIR, 'timeline_template.xlsx'));
}

// ----------------------------------------------------
// 3. ROOMWISE SHEET
// ----------------------------------------------------
async function generateRoomwise() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Roomwise Checklist');
    configureSheet(ws, 4);

    ws.columns = [
        { key: 'done', width: 12 },
        { key: 'space', width: 18 },
        { key: 'subhead', width: 18 },
        { key: 'task', width: 45 },
        { key: 'contractor', width: 22 },
        { key: 'start', width: 12 },
        { key: 'end', width: 12 },
        { key: 'qcStatus', width: 14 },
        { key: 'qcRemarks', width: 25 }
    ];

    ws.mergeCells('A1:I2');
    applyHeaderStyle(ws.getCell('A1'), 'THE 5 DESIGNS');
    ws.mergeCells('A3:I3');
    applyHeaderStyle(ws.getCell('A3'), 'ROOMWISE QUALITY CONTROL CHECKLIST', true);

    const headers = ['Done (TRUE/FALSE)', 'Room / Space', 'Structure Section', 'Checklist Pointer / Task', 'Assigned Contractor', 'Start Date', 'End Date', 'QC Status', 'QC Remarks'];
    ws.getRow(4).values = headers;
    ws.getRow(4).height = 26;
    for (let col = 1; col <= 9; col++) {
        applyTableHeaderStyle(ws.getCell(4, col), headers[col-1]);
    }

    const roomData = [
        // LIVING ROOM
        { isRoomHeader: true, name: 'LIVING ROOM' },
        { isSubhead: true, section: 'Ceiling' },
        { done: false, space: 'Living Room', section: 'Ceiling', task: 'Check layout alignment of GI framing suspension', contractor: 'Ceiling Specialist', start: '2026-08-11', end: '2026-08-13', qc: 'Approved', rem: 'Aligned as per drawings' },
        { done: false, space: 'Living Room', section: 'Ceiling', task: 'Confirm conduit placement for magnetic track lights', contractor: 'Electrical Contractor', start: '2026-08-12', end: '2026-08-14', qc: 'Approved', rem: 'Wires checked & tagged' },
        { done: false, space: 'Living Room', section: 'Ceiling', task: 'Verify gypsum board fixing, jointing & plaster tape', contractor: 'Ceiling Specialist', start: '2026-08-15', end: '2026-08-18', qc: 'Pending', rem: 'Taping completed' },
        
        { isSubhead: true, section: 'Flooring' },
        { done: false, space: 'Living Room', section: 'Flooring', task: 'Subfloor cleaning and dual-layer waterproofing IPS', contractor: 'Civil Contractor', start: '2026-08-18', end: '2026-08-20', qc: 'Approved', rem: 'Pond test successful' },
        { done: false, space: 'Living Room', section: 'Flooring', task: 'Dry layout review of Italian marble slabs (vein matching)', contractor: 'Stone Mason', start: '2026-08-21', end: '2026-08-23', qc: 'Rework Required', rem: 'Re-align slab #4 & #5' },
        { done: false, space: 'Living Room', section: 'Flooring', task: 'Final marble laying, grouting and epoxy sealing', contractor: 'Stone Mason', start: '2026-08-24', end: '2026-08-30', qc: 'Not Started', rem: '-' },
        
        { isSubhead: true, section: 'Elevation North' },
        { done: false, space: 'Living Room', section: 'Elevation North', task: 'Plywood framework marking & HDHMR support backing', contractor: 'Carpentry Team', start: '2026-09-01', end: '2026-09-03', qc: 'Pending', rem: 'Ready for veneer' },
        { done: false, space: 'Living Room', section: 'Elevation North', task: ' walnut veneer pasting & SS gold inlay groove fixing', contractor: 'Carpentry Team', start: '2026-09-04', end: '2026-09-08', qc: 'Not Started', rem: '-' },

        { isSubhead: true, section: 'Elevation South' },
        { done: false, space: 'Living Room', section: 'Elevation South', task: 'Putty coats application & micro-cement base prep', contractor: 'Painting Team', start: '2026-09-09', end: '2026-09-11', qc: 'Not Started', rem: '-' },
        
        { isSubhead: true, section: 'Elevation East' },
        { done: false, space: 'Living Room', section: 'Elevation East', task: 'Wiring conduits and boxes for TV console backboard', contractor: 'Electrical Contractor', start: '2026-09-02', end: '2026-09-03', qc: 'Approved', rem: 'Wires labeled' },

        { isSubhead: true, section: 'Elevation West' },
        { done: false, space: 'Living Room', section: 'Elevation West', task: 'Wall putty, base primer & texture paint finish', contractor: 'Painting Team', start: '2026-09-12', end: '2026-09-15', qc: 'Not Started', rem: '-' },

        // MASTER BEDROOM
        { isRoomHeader: true, name: 'MASTER BEDROOM' },
        { isSubhead: true, section: 'Ceiling' },
        { done: false, space: 'Master Bed', section: 'Ceiling', task: 'G.I. ceiling frame suspension & level check', contractor: 'Ceiling Specialist', start: '2026-08-12', end: '2026-08-14', qc: 'Pending', rem: '-' },
        { isSubhead: true, section: 'Flooring' },
        { done: false, space: 'Master Bed', section: 'Flooring', task: 'Wooden flooring underlay installation', contractor: 'Flooring Contractor', start: '2026-08-26', end: '2026-08-28', qc: 'Not Started', rem: '-' }
    ];

    let rowIdx = 5;
    roomData.forEach(row => {
        const r = ws.getRow(rowIdx);
        if (row.isRoomHeader) {
            ws.mergeCells(`A${rowIdx}:I${rowIdx}`);
            ws.getCell(`A${rowIdx}`).value = row.name;
            applyHeaderStyle(ws.getCell(`A${rowIdx}`), row.name, true);
            r.height = 24;
        } else if (row.isSubhead) {
            ws.mergeCells(`A${rowIdx}:I${rowIdx}`);
            ws.getCell(`A${rowIdx}`).value = `  ↳ ${row.section.toUpperCase()}`;
            applySubheadStyle(ws.getCell(`A${rowIdx}`), `  ↳ ${row.section.toUpperCase()}`);
            r.height = 20;
        } else {
            r.values = [
                row.done, row.space, row.section, row.task, row.contractor,
                row.start, row.end, row.qc, row.rem
            ];
            const bgCol = rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white;
            applyCellStyle(r.getCell(1), { bg: bgCol, align: 'center' });
            
            // Format column A as Boolean Checkbox for Google Sheets validation
            r.getCell(1).dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: ['"TRUE,FALSE"']
            };

            applyCellStyle(r.getCell(2), { bg: bgCol });
            applyCellStyle(r.getCell(3), { bg: bgCol });
            applyCellStyle(r.getCell(4), { bg: bgCol });
            applyCellStyle(r.getCell(5), { bg: bgCol });
            applyCellStyle(r.getCell(6), { bg: bgCol, align: 'center' });
            applyCellStyle(r.getCell(7), { bg: bgCol, align: 'center' });
            applyCellStyle(r.getCell(8), { bg: bgCol, align: 'center', bold: true, color: row.qc === 'Approved' ? 'FF1E7E34' : (row.qc === 'Rework Required' ? 'FFBD2130' : THEME.text) });
            applyCellStyle(r.getCell(9), { bg: bgCol });
            r.height = 26;
        }
        rowIdx++;
    });

    autoFitColumns(ws, { A: 12, B: 18, C: 18, D: 45, E: 22, F: 12, G: 12, H: 14 });
    await wb.xlsx.writeFile(path.join(SHEETS_DIR, 'roomwise_template.xlsx'));
}

// ----------------------------------------------------
// 4. ACCOUNTS SHEET
// ----------------------------------------------------
async function generateAccounts() {
    const wb = new ExcelJS.Workbook();
    
    // Tab 1: Client Invoices
    const wsInvoices = wb.addWorksheet('Client Billing');
    configureSheet(wsInvoices, 5);

    wsInvoices.columns = [
        { key: 'invNo', width: 12 },
        { key: 'date', width: 14 },
        { key: 'desc', width: 35 },
        { key: 'amount', width: 16 },
        { key: 'gst', width: 14 },
        { key: 'total', width: 18 },
        { key: 'received', width: 16 },
        { key: 'balance', width: 16 },
        { key: 'datePaid', width: 14 },
        { key: 'mode', width: 12 }
    ];

    wsInvoices.mergeCells('A1:J2');
    applyHeaderStyle(wsInvoices.getCell('A1'), 'THE 5 DESIGNS');
    wsInvoices.mergeCells('A3:J3');
    applyHeaderStyle(wsInvoices.getCell('A3'), 'CLIENT BILLING SUMMARY & OUTSTANDING CASHFLOW', true);

    wsInvoices.getRow(4).values = ['Project: Luxury Residence', '', 'Client: Mr. Kapoor', '', 'Estimated Budget: ₹45,00,000.00', '', '', 'Currency: INR', '', ''];
    for (let col = 1; col <= 10; col++) {
        applyCellStyle(wsInvoices.getCell(4, col), { bold: true, color: THEME.gold, align: 'center', bg: THEME.beige });
    }
    wsInvoices.mergeCells('A4:B4');
    wsInvoices.mergeCells('C4:D4');
    wsInvoices.mergeCells('E4:G4');
    wsInvoices.mergeCells('H4:J4');

    const headersInv = ['Invoice No', 'Invoice Date', 'Stage / Description', 'Net Amount (INR)', 'GST (18%)', 'Total Invoiced (INR)', 'Amount Received', 'Outstanding Bal', 'Date Received', 'Payment Mode'];
    wsInvoices.getRow(5).values = headersInv;
    wsInvoices.getRow(5).height = 26;
    for (let col = 1; col <= 10; col++) {
        applyTableHeaderStyle(wsInvoices.getCell(5, col), headersInv[col-1]);
    }

    const invoices = [
        { no: 'INV-01', date: '2026-06-10', desc: 'Design Retainer & Token Fee (10%)', amt: 150000, rec: 177000, dateRec: '2026-06-12', mode: 'NEFT' },
        { no: 'INV-02', date: '2026-07-02', desc: 'Mobilization Advance (20%)', amt: 300000, rec: 354000, dateRec: '2026-07-04', mode: 'RTGS' },
        { no: 'INV-03', date: '2026-08-15', desc: 'Civil, Plaster & MEP Stage Payment (25%)', amt: 375000, rec: 0, dateRec: '-', mode: '-' }
    ];

    let rowIdx = 6;
    invoices.forEach(row => {
        const r = wsInvoices.getRow(rowIdx);
        r.values = [
            row.no, row.date, row.desc, row.amt,
            { formula: `D${rowIdx}*0.18` },
            { formula: `D${rowIdx}+E${rowIdx}` },
            row.rec,
            { formula: `F${rowIdx}-G${rowIdx}` },
            row.dateRec, row.mode
        ];
        const bgCol = rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white;
        applyCellStyle(r.getCell(1), { bg: bgCol, align: 'center', bold: true });
        applyCellStyle(r.getCell(2), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(3), { bg: bgCol });
        applyCellStyle(r.getCell(4), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(5), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(6), { bg: bgCol, align: 'right', bold: true, numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(7), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(8), { bg: bgCol, align: 'right', bold: true, numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(9), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(10), { bg: bgCol, align: 'center' });
        r.height = 28;
        rowIdx++;
    });

    const totalRow = wsInvoices.getRow(rowIdx);
    wsInvoices.mergeCells(`A${rowIdx}:C${rowIdx}`);
    totalRow.getCell(1).value = 'TOTALS';
    applyCellStyle(totalRow.getCell(1), { bold: true, align: 'right', bg: THEME.beige });
    applyCellStyle(totalRow.getCell(2), { bg: THEME.beige });
    applyCellStyle(totalRow.getCell(3), { bg: THEME.beige });

    totalRow.getCell(4).value = { formula: `=SUM(D6:D${rowIdx-1})` };
    totalRow.getCell(5).value = { formula: `=SUM(E6:E${rowIdx-1})` };
    totalRow.getCell(6).value = { formula: `=SUM(F6:F${rowIdx-1})` };
    totalRow.getCell(7).value = { formula: `=SUM(G6:G${rowIdx-1})` };
    totalRow.getCell(8).value = { formula: `=SUM(H6:H${rowIdx-1})` };

    applyCellStyle(totalRow.getCell(4), { bold: true, align: 'right', numFormat: '₹#,##0.00', bg: THEME.beige, borderTop: 'thin' });
    applyCellStyle(totalRow.getCell(5), { bold: true, align: 'right', numFormat: '₹#,##0.00', bg: THEME.beige, borderTop: 'thin' });
    applyCellStyle(totalRow.getCell(6), { bold: true, align: 'right', numFormat: '₹#,##0.00', bg: THEME.beige, borderTop: 'thin' });
    applyCellStyle(totalRow.getCell(7), { bold: true, align: 'right', numFormat: '₹#,##0.00', bg: THEME.beige, borderTop: 'thin' });
    applyCellStyle(totalRow.getCell(8), { bold: true, align: 'right', numFormat: '₹#,##0.00', bg: THEME.gold, borderTop: 'medium', borderBottom: 'double', borderColorTop: THEME.obsidian, borderColorBottom: THEME.obsidian });
    applyCellStyle(totalRow.getCell(9), { bg: THEME.beige });
    applyCellStyle(totalRow.getCell(10), { bg: THEME.beige });
    totalRow.height = 28;

    // Tab 2: Vendor Payments
    const wsVendors = wb.addWorksheet('Vendor Disbursements');
    configureSheet(wsVendors, 5);

    wsVendors.columns = [
        { key: 'name', width: 25 },
        { key: 'category', width: 20 },
        { key: 'ref', width: 14 },
        { key: 'amount', width: 16 },
        { key: 'paid', width: 16 },
        { key: 'outstanding', width: 18 },
        { key: 'dueDate', width: 14 },
        { key: 'status', width: 14 }
    ];

    wsVendors.mergeCells('A1:H2');
    applyHeaderStyle(wsVendors.getCell('A1'), 'THE 5 DESIGNS');
    wsVendors.mergeCells('A3:H3');
    applyHeaderStyle(wsVendors.getCell('A3'), 'CONTRACTOR & VENDOR OUTSTANDING LIABILITIES', true);

    wsVendors.getRow(4).values = ['Project: Luxury Residence', '', 'Manager: Srinivas R.', '', 'Date Updated: 2026-06-24', '', '', ''];
    for (let col = 1; col <= 8; col++) {
        applyCellStyle(wsVendors.getCell(4, col), { bold: true, color: THEME.gold, align: 'center', bg: THEME.beige });
    }
    wsVendors.mergeCells('A4:B4');
    wsVendors.mergeCells('C4:D4');
    wsVendors.mergeCells('E4:H4');

    const headersVen = ['Vendor / Contractor Name', 'Work Category', 'Bill Ref Code', 'Bill Amount (INR)', 'Paid Amount (INR)', 'Balance Outstanding', 'Payment Due Date', 'Status'];
    wsVendors.getRow(5).values = headersVen;
    wsVendors.getRow(5).height = 26;
    for (let col = 1; col <= 8; col++) {
        applyTableHeaderStyle(wsVendors.getCell(5, col), headersVen[col-1]);
    }

    const vendors = [
        { name: 'Apex Woodwork Corp', cat: 'Carpentry & Wardrobes', ref: 'APX-W-01', amt: 250000, paid: 150000, due: '2026-08-25', stat: 'Partially Paid' },
        { name: 'Deco Stone Importers', cat: 'Italian Marble Supply', ref: 'DEC-ST-11', amt: 320000, paid: 320000, due: '2026-07-15', stat: 'Fully Paid' },
        { name: 'Shree Electricals', cat: 'Wiring & Conduits', ref: 'SHR-EL-04', amt: 85000, paid: 40000, due: '2026-08-02', stat: 'Partially Paid' },
        { name: 'Asian Paints Depot', cat: 'Emulsion & Primer Supply', ref: 'APD-9922', amt: 45000, paid: 45000, due: '2026-08-10', stat: 'Fully Paid' }
    ];

    let rowIdxV = 6;
    vendors.forEach(row => {
        const r = wsVendors.getRow(rowIdxV);
        r.values = [
            row.name, row.cat, row.ref, row.amt, row.paid,
            { formula: `D${rowIdxV}-E${rowIdxV}` },
            row.due, row.stat
        ];
        const bgCol = rowIdxV % 2 === 0 ? THEME.beigeLight : THEME.white;
        applyCellStyle(r.getCell(1), { bg: bgCol });
        applyCellStyle(r.getCell(2), { bg: bgCol });
        applyCellStyle(r.getCell(3), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(4), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(5), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(6), { bg: bgCol, align: 'right', bold: true, numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(7), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(8), { bg: bgCol, align: 'center', bold: true, color: row.stat === 'Fully Paid' ? 'FF1E7E34' : 'FFC5A059' });
        r.height = 28;
        rowIdxV++;
    });

    const totalRowV = wsVendors.getRow(rowIdxV);
    wsVendors.mergeCells(`A${rowIdxV}:C${rowIdxV}`);
    totalRowV.getCell(1).value = 'TOTALS';
    applyCellStyle(totalRowV.getCell(1), { bold: true, align: 'right', bg: THEME.beige });
    applyCellStyle(totalRowV.getCell(2), { bg: THEME.beige });
    applyCellStyle(totalRowV.getCell(3), { bg: THEME.beige });

    totalRowV.getCell(4).value = { formula: `=SUM(D6:D${rowIdxV-1})` };
    totalRowV.getCell(5).value = { formula: `=SUM(E6:E${rowIdxV-1})` };
    totalRowV.getCell(6).value = { formula: `=SUM(F6:F${rowIdxV-1})` };

    applyCellStyle(totalRowV.getCell(4), { bold: true, align: 'right', numFormat: '₹#,##0.00', bg: THEME.beige, borderTop: 'thin' });
    applyCellStyle(totalRowV.getCell(5), { bold: true, align: 'right', numFormat: '₹#,##0.00', bg: THEME.beige, borderTop: 'thin' });
    applyCellStyle(totalRowV.getCell(6), { bold: true, align: 'right', numFormat: '₹#,##0.00', bg: THEME.gold, borderTop: 'medium', borderBottom: 'double', borderColorTop: THEME.obsidian, borderColorBottom: THEME.obsidian });
    applyCellStyle(totalRowV.getCell(7), { bg: THEME.beige });
    applyCellStyle(totalRowV.getCell(8), { bg: THEME.beige });
    totalRowV.height = 28;

    await wb.xlsx.writeFile(path.join(SHEETS_DIR, 'accounts_template.xlsx'));
}

// ----------------------------------------------------
// 5. JMC SHEET
// ----------------------------------------------------
async function generateJMC() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Joint Measurement Certificate');
    configureSheet(ws, 4);

    ws.columns = [
        { key: 'sNo', width: 10 },
        { key: 'space', width: 18 },
        { key: 'desc', width: 35 },
        { key: 'unit', width: 14 },
        { key: 'multiplier', width: 12 },
        { key: 'length', width: 12 },
        { key: 'width', width: 12 },
        { key: 'depth', width: 14 },
        { key: 'total', width: 15 },
        { key: 'status', width: 12 },
        { key: 'qc', width: 12 },
        { key: 'remarks', width: 25 }
    ];

    ws.mergeCells('A1:L2');
    applyHeaderStyle(ws.getCell('A1'), 'THE 5 DESIGNS');
    ws.mergeCells('A3:L3');
    applyHeaderStyle(ws.getCell('A3'), 'JOINT MEASUREMENT CERTIFICATE (JMC)', true);

    const headers = ['S.No.', 'Space', 'Description', 'Unit (Sft/Rft)', 'Multipliers', 'Length (ft)', 'Width (ft)', 'Height/Depth (ft)', 'Total', 'Status', 'QC', 'Remarks'];
    ws.getRow(4).values = headers;
    ws.getRow(4).height = 26;
    for (let col = 1; col <= 12; col++) {
        applyTableHeaderStyle(ws.getCell(4, col), headers[col-1]);
    }

    const jmcData = [
        { sNo: '1', space: 'Living Room', desc: 'Veneer Paneling north wall (Sft)', unit: 'Sft', mult: 1, len: 15.5, wid: 9.25, dep: 0, stat: 'Measured', qc: 'Approved', rem: 'Checked on site' },
        { sNo: '2', space: 'Living Room', desc: 'SS Gold inlay T-profiles (Rft)', unit: 'Rft', mult: 4, len: 9.25, wid: 0, dep: 0, stat: 'Measured', qc: 'Approved', rem: 'Total 4 vertical runs' },
        { sNo: '3', space: 'Kitchen', desc: 'Quartz Countertop slab length', unit: 'Sft', mult: 1, len: 12.0, wid: 2.25, dep: 0, stat: 'Measured', qc: 'Approved', rem: 'Profile edge polished' },
        { sNo: '4', space: 'Master Bed', desc: 'Gypsum ceiling step molding', unit: 'Rft', mult: 1, len: 64.0, wid: 0, dep: 0, stat: 'Estimated', qc: 'Pending', rem: 'To be measured post drywall' }
    ];

    let rowIdx = 5;
    jmcData.forEach(row => {
        const r = ws.getRow(rowIdx);
        const formulaStr = `=E${rowIdx}*F${rowIdx}*IF(G${rowIdx}>0,G${rowIdx},1)*IF(H${rowIdx}>0,H${rowIdx},1)`;
        r.values = [
            row.sNo, row.space, row.desc, row.unit, row.mult, row.len, row.wid, row.dep,
            { formula: formulaStr },
            row.stat, row.qc, row.rem
        ];
        const bgCol = rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white;
        applyCellStyle(r.getCell(1), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(2), { bg: bgCol });
        applyCellStyle(r.getCell(3), { bg: bgCol });
        applyCellStyle(r.getCell(4), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(5), { bg: bgCol, align: 'right', numFormat: '0.0' });
        applyCellStyle(r.getCell(6), { bg: bgCol, align: 'right', numFormat: '0.00' });
        applyCellStyle(r.getCell(7), { bg: bgCol, align: 'right', numFormat: '0.00' });
        applyCellStyle(r.getCell(8), { bg: bgCol, align: 'right', numFormat: '0.00' });
        applyCellStyle(r.getCell(9), { bg: bgCol, align: 'right', bold: true, numFormat: '#,##0.00' });
        applyCellStyle(r.getCell(10), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(11), { bg: bgCol, align: 'center', bold: true });
        applyCellStyle(r.getCell(12), { bg: bgCol });
        r.height = 26;
        rowIdx++;
    });

    // Signature Area Block
    ws.getRow(rowIdx).height = 15;
    rowIdx++; // Empty spacing row

    ws.mergeCells(`A${rowIdx}:D${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = '   JOINT SITE SIGN-OFFS & VERIFICATIONS';
    applyCellStyle(ws.getCell(`A${rowIdx}`), { bold: true, color: THEME.gold, bg: THEME.obsidian });
    for (let c = 2; c <= 12; c++) {
        applyCellStyle(ws.getCell(rowIdx, c), { bg: THEME.obsidian });
    }
    ws.getRow(rowIdx).height = 22;
    rowIdx++;

    ws.getRow(rowIdx).height = 40;
    ws.mergeCells(`A${rowIdx}:D${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = '\n_________________________________\nLead Site Engineer (The 5 Designs)';
    applyCellStyle(ws.getCell(`A${rowIdx}`), { align: 'center', wrapText: true });

    ws.mergeCells(`E${rowIdx}:H${rowIdx}`);
    ws.getCell(`E${rowIdx}`).value = '\n_________________________________\nAssigned Project Contractor';
    applyCellStyle(ws.getCell(`E${rowIdx}`), { align: 'center', wrapText: true });

    ws.mergeCells(`I${rowIdx}:L${rowIdx}`);
    ws.getCell(`I${rowIdx}`).value = '\n_________________________________\nManaging Project Manager';
    applyCellStyle(ws.getCell(`I${rowIdx}`), { align: 'center', wrapText: true });

    autoFitColumns(ws, { A: 10, B: 18, C: 35, D: 14, E: 12, F: 12, G: 12, H: 14, I: 15 });
    await wb.xlsx.writeFile(path.join(SHEETS_DIR, 'jmc_template.xlsx'));
}

// ----------------------------------------------------
// 6. VENDOR SCOPE TEMPLATE
// ----------------------------------------------------
async function generateVendorScope() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Vendor Scope of Work');
    configureSheet(ws, 7);

    ws.columns = [
        { key: 'sNo', width: 8 },
        { key: 'section', width: 30 },
        { key: 'specs', width: 50 },
        { key: 'responsibility', width: 30 },
        { key: 'tolerance', width: 40 },
        { key: 'qcProtocol', width: 25 }
    ];

    ws.mergeCells('A1:F2');
    applyHeaderStyle(ws.getCell('A1'), 'THE 5 DESIGNS');
    ws.mergeCells('A3:F3');
    applyHeaderStyle(ws.getCell('A3'), 'STANDARD VENDOR SCOPE OF WORK', true);

    ws.getRow(4).values = ['Work Type:', 'Carpentry / False Ceiling / Painting / Flooring / Fabrication', '', 'Project Name:', 'Luxury Villa Project', ''];
    applyCellStyle(ws.getCell(4, 1), { bold: true, color: THEME.gold, bg: THEME.beige });
    applyCellStyle(ws.getCell(4, 2), { bold: true, color: THEME.obsidian, bg: THEME.white });
    ws.mergeCells('B4:C4');
    applyCellStyle(ws.getCell(4, 4), { bold: true, color: THEME.gold, bg: THEME.beige });
    applyCellStyle(ws.getCell(4, 5), { bold: true, color: THEME.obsidian, bg: THEME.white });
    ws.mergeCells('E4:F4');
    ws.getRow(4).height = 24;

    ws.getRow(5).values = ['Vendor Name:', '[Enter Contractor Name Here]', '', 'Date Issued:', '2026-06-24', ''];
    applyCellStyle(ws.getCell(5, 1), { bold: true, color: THEME.gold, bg: THEME.beige });
    applyCellStyle(ws.getCell(5, 2), { italic: true, bg: THEME.white });
    ws.mergeCells('B5:C5');
    applyCellStyle(ws.getCell(5, 4), { bold: true, color: THEME.gold, bg: THEME.beige });
    applyCellStyle(ws.getCell(5, 5), { bg: THEME.white });
    ws.mergeCells('E5:F5');
    ws.getRow(5).height = 24;

    // Formatting instruction row
    ws.mergeCells('A6:F6');
    ws.getCell('A6').value = 'Instruction: Type in cell B4 the trade/work category (e.g. Carpentry) to customize this scope for vendor issuance.';
    applyCellStyle(ws.getCell('A6'), { italic: true, color: THEME.textMuted, bg: THEME.beigeLight, align: 'center' });
    ws.getRow(6).height = 20;

    const headers = ['S.No.', 'Scope Deliverable / Segment', 'Execution Details & Material Specifications', 'Material Provision (Client vs Vendor)', 'Quality Standards & Tolerance Levels', 'QC Review Protocol'];
    ws.getRow(7).values = headers;
    ws.getRow(7).height = 26;
    for (let col = 1; col <= 6; col++) {
        applyTableHeaderStyle(ws.getCell(7, col), headers[col-1]);
    }

    const scopeData = [
        { sNo: '1', sec: 'Site Verification', specs: 'Marking of coordinates, level verification using digital laser levels before cutting/fabrication.', resp: 'Vendor scope (tools & marking accessories)', tol: 'Level variations should be zero (+/- 1mm max)', qc: 'Laser level verification by Site Engineer' },
        { sNo: '2', sec: 'Material Storage', specs: 'Organizing and stack-housing raw sheets/planks/paints on dry wooden pallets, protected from damp.', resp: 'Company provides room; Vendor handles sorting', tol: 'Zero moisture contact. Stack height max 6 feet', qc: 'Daily stack moisture check' },
        { sNo: '3', sec: 'Surface Preparation', specs: 'Sanding, base cleaning, minor crack filling, joint packing, primer coating as specified in drawing details.', resp: 'Material by Company; labor/tools by Vendor', tol: 'Zero loose dust particles before overlay', qc: 'Touch test & dust tape residue test' },
        { sNo: '4', sec: 'Core Execution & Fittings', specs: 'Assembling elements, joint paste routing, hardware fittings (soft-close runners/channels, profiles).', resp: 'Material by Company; tools & labor by Vendor', tol: 'Bostik glue adhesives, Hettich channels alignment +/- 0.5mm', qc: 'Load/sliding test: 20 repetitions' },
        { sNo: '5', sec: 'Housekeeping & Handover', specs: 'Debris sorting, bagging, site vacuuming, surface cleaning, and joint snag clearance.', resp: 'Vendor provides bags; Company manages dump disposal', tol: 'Zero dust, glue smudges, or scratches on finishes', qc: 'Visual snag walk-through' }
    ];

    let rowIdx = 8;
    scopeData.forEach(row => {
        const r = ws.getRow(rowIdx);
        r.values = [row.sNo, row.sec, row.specs, row.resp, row.tol, row.qc];
        const bgCol = rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white;
        applyCellStyle(r.getCell(1), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(2), { bg: bgCol, bold: true });
        applyCellStyle(r.getCell(3), { bg: bgCol });
        applyCellStyle(r.getCell(4), { bg: bgCol });
        applyCellStyle(r.getCell(5), { bg: bgCol });
        applyCellStyle(r.getCell(6), { bg: bgCol });
        r.height = 36;
        rowIdx++;
    });

    autoFitColumns(ws, { A: 8, B: 30, C: 50, D: 30, E: 40, F: 25 });
    await wb.xlsx.writeFile(path.join(SHEETS_DIR, 'vendor_scope_template.xlsx'));
}

// ----------------------------------------------------
// 7. GENERIC SHEET
// ----------------------------------------------------
async function generateGeneric() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Custom Project Sheet');
    configureSheet(ws, 4);

    ws.columns = [
        { key: 'sNo', width: 8 },
        { key: 'item', width: 25 },
        { key: 'desc', width: 45 },
        { key: 'cat', width: 18 },
        { key: 'qty', width: 12 },
        { key: 'unit', width: 10 },
        { key: 'rate', width: 14 },
        { key: 'total', width: 16 },
        { key: 'status', width: 12 },
        { key: 'remarks', width: 25 }
    ];

    ws.mergeCells('A1:J2');
    applyHeaderStyle(ws.getCell('A1'), 'THE 5 DESIGNS');
    ws.mergeCells('A3:J3');
    applyHeaderStyle(ws.getCell('A3'), '[TYPE CUSTOM SHEET HEADING HERE]', true);

    const headers = ['S.No.', 'Item Name', 'Detailed Description', 'Category', 'Qty', 'Unit', 'Rate (INR)', 'Total (INR)', 'Status', 'Remarks'];
    ws.getRow(4).values = headers;
    ws.getRow(4).height = 26;
    for (let col = 1; col <= 10; col++) {
        applyTableHeaderStyle(ws.getCell(4, col), headers[col-1]);
    }

    // Insert dummy rows for client customization
    for (let rowIdx = 5; rowIdx <= 15; rowIdx++) {
        const r = ws.getRow(rowIdx);
        r.values = [
            rowIdx - 4, '', '', '', '', '', '',
            { formula: `E${rowIdx}*G${rowIdx}` },
            '', ''
        ];
        const bgCol = rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white;
        applyCellStyle(r.getCell(1), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(2), { bg: bgCol });
        applyCellStyle(r.getCell(3), { bg: bgCol });
        applyCellStyle(r.getCell(4), { bg: bgCol });
        applyCellStyle(r.getCell(5), { bg: bgCol, align: 'right', numFormat: '#,##0.00' });
        applyCellStyle(r.getCell(6), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(7), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(8), { bg: bgCol, align: 'right', bold: true, numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(9), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(10), { bg: bgCol });
        r.height = 26;
    }

    const totalRowIdx = 16;
    ws.mergeCells(`A${totalRowIdx}:G${totalRowIdx}`);
    ws.getCell(`A${totalRowIdx}`).value = 'GRAND TOTAL';
    applyCellStyle(ws.getCell(`A${totalRowIdx}`), { bold: true, align: 'right', bg: THEME.beige });
    for (let col = 2; col <= 7; col++) {
        applyCellStyle(ws.getCell(totalRowIdx, col), { bg: THEME.beige });
    }
    
    ws.getCell(`H${totalRowIdx}`).value = { formula: `=SUM(H5:H15)` };
    applyCellStyle(ws.getCell(totalRowIdx, 8), {
        bold: true,
        align: 'right',
        bg: THEME.gold,
        color: THEME.obsidian,
        numFormat: '₹#,##0.00',
        borderTop: 'medium',
        borderBottom: 'double',
        borderColorTop: THEME.obsidian,
        borderColorBottom: THEME.obsidian
    });
    applyCellStyle(ws.getCell(totalRowIdx, 9), { bg: THEME.beige });
    applyCellStyle(ws.getCell(totalRowIdx, 10), { bg: THEME.beige });
    ws.getRow(totalRowIdx).height = 28;

    autoFitColumns(ws, { A: 8, B: 25, C: 45, D: 18, E: 12, F: 10 });
    await wb.xlsx.writeFile(path.join(SHEETS_DIR, 'generic_template.xlsx'));
}

// ----------------------------------------------------
// 8. MATERIAL PROCUREMENT SHEET
// ----------------------------------------------------
async function generateProcurement() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Material Procurement');
    configureSheet(ws, 4);

    ws.columns = [
        { key: 'itemNo', width: 8 },
        { key: 'space', width: 18 },
        { key: 'matName', width: 25 },
        { key: 'brand', width: 20 },
        { key: 'specs', width: 25 },
        { key: 'qty', width: 12 },
        { key: 'unit', width: 10 },
        { key: 'stage', width: 20 },
        { key: 'leadTime', width: 16 },
        { key: 'delivery', width: 20 },
        { key: 'vendor', width: 20 },
        { key: 'invNo', width: 14 },
        { key: 'remarks', width: 25 }
    ];

    ws.mergeCells('A1:M2');
    applyHeaderStyle(ws.getCell('A1'), 'THE 5 DESIGNS');
    ws.mergeCells('A3:M3');
    applyHeaderStyle(ws.getCell('A3'), 'PROJECT MATERIAL PROCUREMENT TRACKER', true);

    const headers = ['Item No', 'Space/Area', 'Material Name', 'Brand/Mfr', 'Spec/Grade/Size', 'Qty Req', 'Unit', 'Procurement Stage', 'Lead Time (Days)', 'Committed Delivery', 'Vendor Name', 'Invoice Ref', 'Status / Remarks'];
    ws.getRow(4).values = headers;
    ws.getRow(4).height = 26;
    for (let col = 1; col <= 13; col++) {
        applyTableHeaderStyle(ws.getCell(4, col), headers[col-1]);
    }

    const procurementData = [
        { item: '1', space: 'Living Room', name: 'Italian Marble Slabs', brand: 'Classic Marble Co', specs: 'Dyna Collection, 18mm thickness', qty: 450, unit: 'Sft', stage: 'Delivered', lead: 5, delDate: '2026-07-20', vendor: 'Deco Stone Imports', inv: 'DEC-ST-11', rem: 'Slabs stacked in Room 1' },
        { item: '2', space: 'Kitchen & Bath', name: 'Waterproofing base coat', brand: 'Dr. Fixit', specs: 'Fastflex 2K Dual Component', qty: 6, unit: 'Cans', stage: 'Delivered', lead: 2, delDate: '2026-07-22', vendor: 'Apex Paints Depot', inv: 'APD-9922', rem: 'Used in wet areas' },
        { item: '3', space: 'All Areas', name: 'Gypsum Board panels', brand: 'Saint-Gobain', specs: 'Standard Gypsum, 12mm thickness', qty: 65, unit: 'Nos', stage: 'Ordered', lead: 3, delDate: '2026-08-08', vendor: 'BuildMart Agencies', inv: 'BM-2026-09', rem: 'Payment cleared' },
        { item: '4', space: 'All Areas', name: 'FRLS Copper Wiring', brand: 'Finolex', specs: '1.5 Sqmm & 2.5 Sqmm multi-strand', qty: 10, unit: 'Coils', stage: 'Ordered', lead: 4, delDate: '2026-08-02', vendor: 'Shree Electricals', inv: 'SHR-EL-04', rem: 'Scheduled with conduits' },
        { item: '5', space: 'Master Bed', name: 'Marine Grade Plywood', brand: 'CenturyPly', specs: 'Club Prime MR, 19mm', qty: 45, unit: 'Sheets', stage: 'In Transit', lead: 7, delDate: '2026-08-15', vendor: 'Century Depot', inv: 'CD-8877', rem: 'On road, ETA 2 days' }
    ];

    let rowIdx = 5;
    procurementData.forEach(row => {
        const r = ws.getRow(rowIdx);
        r.values = [
            row.item, row.space, row.name, row.brand, row.specs, row.qty, row.unit,
            row.stage, row.lead, row.delDate, row.vendor, row.inv, row.rem
        ];
        const bgCol = rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white;
        applyCellStyle(r.getCell(1), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(2), { bg: bgCol });
        applyCellStyle(r.getCell(3), { bg: bgCol, bold: true });
        applyCellStyle(r.getCell(4), { bg: bgCol });
        applyCellStyle(r.getCell(5), { bg: bgCol });
        applyCellStyle(r.getCell(6), { bg: bgCol, align: 'right', numFormat: '#,##0.0' });
        applyCellStyle(r.getCell(7), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(8), { bg: bgCol, align: 'center', bold: true, color: row.stage === 'Delivered' ? 'FF1E7E34' : 'FFC5A059' });
        applyCellStyle(r.getCell(9), { bg: bgCol, align: 'right' });
        applyCellStyle(r.getCell(10), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(11), { bg: bgCol });
        applyCellStyle(r.getCell(12), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(13), { bg: bgCol });
        r.height = 26;
        rowIdx++;
    });

    autoFitColumns(ws, { A: 8, B: 18, C: 25, D: 20, E: 25, F: 12, G: 10, H: 20, I: 16 });
    await wb.xlsx.writeFile(path.join(SHEETS_DIR, 'material_procurement.xlsx'));
}

// ----------------------------------------------------
// 9. COST COMPARISON - SUPPLY
// ----------------------------------------------------
async function generateCostComparisonSupply() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Supply Cost Comparison');
    configureSheet(ws, 4);

    ws.columns = [
        { key: 'sNo', width: 8 },
        { key: 'item', width: 25 },
        { key: 'specs', width: 30 },
        { key: 'qty', width: 10 },
        { key: 'unit', width: 10 },
        { key: 'vArate', width: 14 },
        { key: 'vAtotal', width: 16 },
        { key: 'vBrate', width: 14 },
        { key: 'vBtotal', width: 16 },
        { key: 'vCrate', width: 14 },
        { key: 'vCtotal', width: 16 },
        { key: 'selected', width: 18 },
        { key: 'budget', width: 14 },
        { key: 'variance', width: 16 },
        { key: 'remarks', width: 25 }
    ];

    ws.mergeCells('A1:O2');
    applyHeaderStyle(ws.getCell('A1'), 'THE 5 DESIGNS');
    ws.mergeCells('A3:O3');
    applyHeaderStyle(ws.getCell('A3'), 'MATERIAL & SUPPLY COST COMPARISON (VENDOR QUOTES ANALYSIS)', true);

    const headers = [
        'S.No.', 'Material Item', 'Specification / Details', 'Qty', 'Unit',
        'Vendor A Rate', 'Vendor A Total',
        'Vendor B Rate', 'Vendor B Total',
        'Vendor C Rate', 'Vendor C Total',
        'Selected Vendor', 'Budget (INR)', 'Variance vs Budget', 'Remarks'
    ];
    ws.getRow(4).values = headers;
    ws.getRow(4).height = 26;
    for (let col = 1; col <= 15; col++) {
        applyTableHeaderStyle(ws.getCell(4, col), headers[col-1]);
    }

    const costData = [
        { sNo: '1', item: 'Italian Marble Dyna', specs: '18mm slab selections', qty: 450, unit: 'Sft', va: 380, vb: 350, vc: 410, sel: 'Vendor B', bud: 165000, rem: 'Vendor B chosen for vein match' },
        { sNo: '2', item: 'Marine Plywood 19mm', specs: 'Greenply Club MR grade', qty: 60, unit: 'Sheets', va: 2100, vb: 2150, vc: 2200, sel: 'Vendor A', bud: 130000, rem: 'Bulk discount from Vendor A' },
        { sNo: '3', item: 'Quartz Kitchen Counter', specs: 'White Quartz slab 20mm', qty: 3, unit: 'Nos', va: 18500, vb: 19000, vc: 18000, sel: 'Vendor C', bud: 60000, rem: 'Vendor C matches spec best' }
    ];

    let rowIdx = 5;
    costData.forEach(row => {
        const r = ws.getRow(rowIdx);
        const formulaA = `=D${rowIdx}*F${rowIdx}`;
        const formulaB = `=D${rowIdx}*H${rowIdx}`;
        const formulaC = `=D${rowIdx}*J${rowIdx}`;
        const varFormula = `=IF(L${rowIdx}="Vendor A", G${rowIdx}, IF(L${rowIdx}="Vendor B", I${rowIdx}, K${rowIdx})) - M${rowIdx}`;

        r.values = [
            row.sNo, row.item, row.specs, row.qty, row.unit,
            row.va, { formula: formulaA },
            row.vb, { formula: formulaB },
            row.vc, { formula: formulaC },
            row.sel, row.bud, { formula: varFormula }, row.rem
        ];

        const bgCol = rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white;
        applyCellStyle(r.getCell(1), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(2), { bg: bgCol, bold: true });
        applyCellStyle(r.getCell(3), { bg: bgCol });
        applyCellStyle(r.getCell(4), { bg: bgCol, align: 'right' });
        applyCellStyle(r.getCell(5), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(6), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(7), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(8), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(9), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(10), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(11), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(12), { bg: bgCol, align: 'center', bold: true, color: THEME.gold });
        applyCellStyle(r.getCell(13), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(14), { bg: bgCol, align: 'right', bold: true, numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(15), { bg: bgCol });
        r.height = 28;
        rowIdx++;
    });

    autoFitColumns(ws, { A: 8, B: 25, C: 30, D: 10, E: 10, F: 14, G: 16 });
    await wb.xlsx.writeFile(path.join(SHEETS_DIR, 'cost_comparison_supply.xlsx'));
}

// ----------------------------------------------------
// 10. COST COMPARISON - SERVICES
// ----------------------------------------------------
async function generateCostComparisonServices() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Services Cost Comparison');
    configureSheet(ws, 4);

    ws.columns = [
        { key: 'sNo', width: 8 },
        { key: 'service', width: 25 },
        { key: 'category', width: 18 },
        { key: 'qty', width: 10 },
        { key: 'unit', width: 10 },
        { key: 'cArate', width: 14 },
        { key: 'cAtotal', width: 16 },
        { key: 'cBrate', width: 14 },
        { key: 'cBtotal', width: 16 },
        { key: 'cCrate', width: 14 },
        { key: 'cCtotal', width: 16 },
        { key: 'selected', width: 18 },
        { key: 'budget', width: 14 },
        { key: 'variance', width: 16 },
        { key: 'remarks', width: 25 }
    ];

    ws.mergeCells('A1:O2');
    applyHeaderStyle(ws.getCell('A1'), 'THE 5 DESIGNS');
    ws.mergeCells('A3:O3');
    applyHeaderStyle(ws.getCell('A3'), 'SERVICES & CONTRACTING COST COMPARISON (CONTRACTOR QUOTES ANALYSIS)', true);

    const headers = [
        'S.No.', 'Service Description', 'Category', 'Qty', 'Unit',
        'Contr A Rate', 'Contr A Total',
        'Contr B Rate', 'Contr B Total',
        'Contr C Rate', 'Contr C Total',
        'Selected Contr', 'Budget (INR)', 'Variance vs Budget', 'Remarks'
    ];
    ws.getRow(4).values = headers;
    ws.getRow(4).height = 26;
    for (let col = 1; col <= 15; col++) {
        applyTableHeaderStyle(ws.getCell(4, col), headers[col-1]);
    }

    const servicesData = [
        { sNo: '1', service: 'Wardrobe Joinery Labor', cat: 'Carpentry', qty: 140, unit: 'Sft', ca: 450, cb: 480, cc: 430, sel: 'Contr A', bud: 65000, rem: 'Contr A has better finishing crew' },
        { sNo: '2', service: 'Wall Texture Painting', cat: 'Painting', qty: 5400, unit: 'Sft', ca: 12, cb: 10, cc: 15, sel: 'Contr B', bud: 60000, rem: 'Contr B is specialized in texture' },
        { sNo: '3', service: 'Italian Marble Polish', cat: 'Flooring', qty: 450, unit: 'Sft', ca: 85, cb: 90, cc: 80, sel: 'Contr C', bud: 40000, rem: 'Contr C offers 7-step mirror polish' }
    ];

    let rowIdx = 5;
    servicesData.forEach(row => {
        const r = ws.getRow(rowIdx);
        const formulaA = `=D${rowIdx}*F${rowIdx}`;
        const formulaB = `=D${rowIdx}*H${rowIdx}`;
        const formulaC = `=D${rowIdx}*J${rowIdx}`;
        const varFormula = `=IF(L${rowIdx}="Contr A", G${rowIdx}, IF(L${rowIdx}="Contr B", I${rowIdx}, K${rowIdx})) - M${rowIdx}`;

        r.values = [
            row.sNo, row.service, row.cat, row.qty, row.unit,
            row.ca, { formula: formulaA },
            row.cb, { formula: formulaB },
            row.cc, { formula: formulaC },
            row.sel, row.bud, { formula: varFormula }, row.rem
        ];

        const bgCol = rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white;
        applyCellStyle(r.getCell(1), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(2), { bg: bgCol, bold: true });
        applyCellStyle(r.getCell(3), { bg: bgCol });
        applyCellStyle(r.getCell(4), { bg: bgCol, align: 'right' });
        applyCellStyle(r.getCell(5), { bg: bgCol, align: 'center' });
        applyCellStyle(r.getCell(6), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(7), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(8), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(9), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(10), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(11), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(12), { bg: bgCol, align: 'center', bold: true, color: THEME.gold });
        applyCellStyle(r.getCell(13), { bg: bgCol, align: 'right', numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(14), { bg: bgCol, align: 'right', bold: true, numFormat: '₹#,##0.00' });
        applyCellStyle(r.getCell(15), { bg: bgCol });
        r.height = 28;
        rowIdx++;
    });

    autoFitColumns(ws, { A: 8, B: 25, C: 18, D: 10, E: 10, F: 14, G: 16 });
    await wb.xlsx.writeFile(path.join(SHEETS_DIR, 'cost_comparison_services.xlsx'));
}

// ----------------------------------------------------
// 11. CONTRACT TERMS TEMPLATE
// ----------------------------------------------------
async function generateContractTerms() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Contract Legal Terms');
    configureSheet(ws, 4);

    ws.columns = [
        { key: 'clauseNo', width: 12 },
        { key: 'heading', width: 25 },
        { key: 'terms', width: 85 }
    ];

    ws.mergeCells('A1:C2');
    applyHeaderStyle(ws.getCell('A1'), 'THE 5 DESIGNS');
    ws.mergeCells('A3:C3');
    applyHeaderStyle(ws.getCell('A3'), 'WORK CONTRACT STANDARD TERMS & CONDITIONS', true);

    const headers = ['Clause No.', 'Clause Heading', 'Agreement Terms & Execution Specifications'];
    ws.getRow(4).values = headers;
    ws.getRow(4).height = 26;
    for (let col = 1; col <= 3; col++) {
        applyTableHeaderStyle(ws.getCell(4, col), headers[col-1]);
    }

    const clauses = [
        { no: '1.0', heading: 'Scope of Works', text: 'The scope of works is bounded strictly by the Bill of Quantities (BOQ) and authorized GFC drawings. Any variations, revisions, or additions requested verbally by the Client or Contractor will only be binding once processed and signed via a Joint Measurement Certificate (JMC) and a formal written Variation Order (VO) stating rates and impact on the timeline.' },
        { no: '2.0', heading: 'Measurement & Billing', text: 'All progress bills raised by contractors and invoices raised to the client shall be measured jointly on-site based on actual net executed quantities. The billing calculations will strictly follow the measurement principles detailed in the JMC sheet (using Length x Width x Depth multipliers). Deductions for cut-outs and voids larger than 4 Sft will be enforced.' },
        { no: '3.0', heading: 'Delay Penalties', text: 'Time is of the essence for this contract. If the Service Provider / Contractor fails to achieve the milestones outlined in the Project Timeline sheet due to reasons solely attributable to them, a delay penalty (Liquidated Damages) of 0.5% of the total pending work value per week of delay shall be levied, up to a maximum cap of 5% of the total contract value.' },
        { no: '4.0', heading: 'Quality & Defect Liability', text: 'The Contractor guarantees that all materials and workmanship supplied match the standards outlined in the Vendor Scope of Work. A Defect Liability Period (DLP) of 12 (Twelve) calendar months from the date of final handover is applicable. Any structural defects, alignments issues, paint peeling, or hardware malfunction during this period shall be rectified by the Contractor at zero cost to the Client.' },
        { no: '5.0', heading: 'Dispute Resolution', text: 'All disputes, claims, or differences arising out of or in connection with this work contract shall first be attempted to be resolved amicably through mediation between the Lead Designer, Contractor, and Client within 15 days. If unresolved, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996.' },
        { no: '6.0', heading: 'Judicial Jurisdiction', text: 'This Contract is governed by and shall be construed in accordance with the laws of India. All legal actions, litigation, or judicial proceedings arising out of or related to this project, including claims on billing, measurements, or breaches, shall be subject to the exclusive jurisdiction of the competent courts located in Hyderabad, Telangana, India.' }
    ];

    let rowIdx = 5;
    clauses.forEach(row => {
        const r = ws.getRow(rowIdx);
        r.values = [row.no, row.heading, row.text];
        const bgCol = rowIdx % 2 === 0 ? THEME.beigeLight : THEME.white;
        applyCellStyle(r.getCell(1), { bg: bgCol, align: 'center', bold: true });
        applyCellStyle(r.getCell(2), { bg: bgCol, bold: true });
        applyCellStyle(r.getCell(3), { bg: bgCol, align: 'left', wrapText: true });
        r.height = 70; // Taller row height to fit long text comfortably
        rowIdx++;
    });

    autoFitColumns(ws, { A: 12, B: 25, C: 85 });
    await wb.xlsx.writeFile(path.join(SHEETS_DIR, 'contract_terms_template.xlsx'));
}

// ----------------------------------------------------
// MAIN COMPILER
// ----------------------------------------------------
async function main() {
    console.log('Compiling 11 branded spreadsheets for The 5 Designs...');
    try {
        await generateBOQ();
        console.log('✔ Generated boq_template.xlsx');
        
        await generateTimeline();
        console.log('✔ Generated timeline_template.xlsx');
        
        await generateRoomwise();
        console.log('✔ Generated roomwise_template.xlsx');
        
        await generateAccounts();
        console.log('✔ Generated accounts_template.xlsx');
        
        await generateJMC();
        console.log('✔ Generated jmc_template.xlsx');
        
        await generateVendorScope();
        console.log('✔ Generated vendor_scope_template.xlsx');
        
        await generateGeneric();
        console.log('✔ Generated generic_template.xlsx');
        
        await generateProcurement();
        console.log('✔ Generated material_procurement.xlsx');
        
        await generateCostComparisonSupply();
        console.log('✔ Generated cost_comparison_supply.xlsx');
        
        await generateCostComparisonServices();
        console.log('✔ Generated cost_comparison_services.xlsx');
        
        await generateContractTerms();
        console.log('✔ Generated contract_terms_template.xlsx');
        
        console.log('Spreadsheets compiled successfully!');
    } catch (e) {
        console.error('Spreadsheet compilation failed: ', e);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
