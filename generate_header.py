import re

content = """
    {financeColumnPrefs.isColumnVisible('uniqueId') && <TableHead className="min-w-[140px] whitespace-nowrap font-semibold sticky left-0 z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Unique ID</TableHead>}
    {financeColumnPrefs.isColumnVisible('projectId') && <TableHead className="min-w-[140px] whitespace-nowrap font-semibold sticky left-[140px] z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Project ID</TableHead>}
    {financeColumnPrefs.isColumnVisible('sampleCollectionDate') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Sample Collection Date</TableHead>}
    {financeColumnPrefs.isColumnVisible('organisationHospital') && <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Organisation / Hospital</TableHead>}
    {financeColumnPrefs.isColumnVisible('clinicianResearcherName') && <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Name</TableHead>}
    {financeColumnPrefs.isColumnVisible('clinicianResearcherEmail') && <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Email</TableHead>}
    {financeColumnPrefs.isColumnVisible('clinicianResearcherPhone') && <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Phone</TableHead>}
    {financeColumnPrefs.isColumnVisible('clinicianResearcherAddress') && <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Clinician / Researcher Address</TableHead>}
    {financeColumnPrefs.isColumnVisible('patientClientName') && <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Name</TableHead>}
    {financeColumnPrefs.isColumnVisible('patientClientEmail') && <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Email</TableHead>}
    {financeColumnPrefs.isColumnVisible('patientClientPhone') && <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Patient / Client Phone</TableHead>}
    {financeColumnPrefs.isColumnVisible('patientClientAddress') && <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Patient / Client Address</TableHead>}
    {financeColumnPrefs.isColumnVisible('serviceName') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Service Name</TableHead>}
    {financeColumnPrefs.isColumnVisible('budget') && <TableHead className="min-w-[120px] whitespace-nowrap font-semibold">Budget</TableHead>}
    {financeColumnPrefs.isColumnVisible('phlebotomistCharges') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Phlebotomist Charges</TableHead>}
    {financeColumnPrefs.isColumnVisible('salesResponsiblePerson') && <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Sales / Responsible Person</TableHead>}
    {financeColumnPrefs.isColumnVisible('sampleShipmentAmount') && <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Sample Shipment Amount</TableHead>}
    {financeColumnPrefs.isColumnVisible('invoiceNumber') && <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Invoice Number</TableHead>}
    {financeColumnPrefs.isColumnVisible('invoiceAmount') && <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Invoice Amount</TableHead>}
    {financeColumnPrefs.isColumnVisible('invoiceDate') && <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Invoice Date</TableHead>}
    {financeColumnPrefs.isColumnVisible('paymentReceiptAmount') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Payment Receipt Amount</TableHead>}
    {financeColumnPrefs.isColumnVisible('balanceAmount') && <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Balance Amount</TableHead>}
    {financeColumnPrefs.isColumnVisible('paymentReceiptDate') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Payment Receipt Date</TableHead>}
    {financeColumnPrefs.isColumnVisible('modeOfPayment') && <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Mode of Payment</TableHead>}
    {financeColumnPrefs.isColumnVisible('transactionalNumber') && <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Transactional Number</TableHead>}
    {financeColumnPrefs.isColumnVisible('balanceAmountReceivedDate') && <TableHead className="min-w-[170px] whitespace-nowrap font-semibold">Balance Amount Received Date</TableHead>}
    {financeColumnPrefs.isColumnVisible('totalAmountReceivedStatus') && <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Total Amount Received Status</TableHead>}
    {financeColumnPrefs.isColumnVisible('utrDetails') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">UTR Details</TableHead>}
    {financeColumnPrefs.isColumnVisible('thirdPartyCharges') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Charges</TableHead>}
    {financeColumnPrefs.isColumnVisible('otherCharges') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Other Charges</TableHead>}
    {financeColumnPrefs.isColumnVisible('otherChargesReason') && <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Other Charges Reason</TableHead>}
    {financeColumnPrefs.isColumnVisible('thirdPartyName') && <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Third Party Name</TableHead>}
    {financeColumnPrefs.isColumnVisible('thirdPartyPhone') && <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Third Party Phone</TableHead>}
    {financeColumnPrefs.isColumnVisible('thirdPartyPaymentDate') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Payment Date</TableHead>}
    {financeColumnPrefs.isColumnVisible('thirdPartyPaymentStatus') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Payment Status</TableHead>}
    {financeColumnPrefs.isColumnVisible('alertToLabprocessTeam') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Alert to Labprocess Team</TableHead>}
    {financeColumnPrefs.isColumnVisible('alertToReportTeam') && <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Alert to Report Team</TableHead>}
    {financeColumnPrefs.isColumnVisible('alertToTechnicalLead') && <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Alert to Technical Lead</TableHead>}
    {financeColumnPrefs.isColumnVisible('screenshotDocument') && <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Screenshot/Document</TableHead>}
    {financeColumnPrefs.isColumnVisible('createdAt') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Created At</TableHead>}
    {financeColumnPrefs.isColumnVisible('createdBy') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Created By</TableHead>}
    {financeColumnPrefs.isColumnVisible('modifiedAt') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Modified At</TableHead>}
    {financeColumnPrefs.isColumnVisible('modifiedBy') && <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Modified By</TableHead>}
    {financeColumnPrefs.isColumnVisible('remarkComment') && <TableHead className="min-w-[220px] whitespace-nowrap font-semibold">Remark / Comment</TableHead>}
    {financeColumnPrefs.isColumnVisible('actions') && <TableHead className="sticky right-0 z-40 min-w-[150px] whitespace-nowrap font-semibold bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700 actions-column">Actions</TableHead>}
"""

lines = content.strip().split('\n')
for line in lines:
    # Extract key from isColumnVisible('key')
    match = re.search(r"isColumnVisible\('([^']+)'\)", line)
    if match:
        key = match.group(1)
        if key == 'actions':
             print(line)
             continue
        
        # Add onClick and cursor-pointer
        # Add sort indicator
        
        # Insert onClick before className
        line = line.replace('<TableHead className="', f'<TableHead onClick={{() => {{ setSortKey(\'{key}\'); setSortDir(s => s === \'asc\' ? \'desc\' : \'asc\'); }}}} className="cursor-pointer ')
        
        # Add sort indicator before </TableHead>
        line = line.replace('</TableHead>', f'{{sortKey === \'{key}\' ? (sortDir === \'asc\' ? \' ▲\' : \' ▼\') : \'\'}}</TableHead>')
        
        print(line)
    else:
        print(line)
