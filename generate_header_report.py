import re

content = """
                    {reportColumnPrefs.isColumnVisible('uniqueId') && <TableHead className="min-w-[120px] whitespace-nowrap font-semibold sticky left-0 z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] py-1">Unique ID</TableHead>}
                    {reportColumnPrefs.isColumnVisible('projectId') && <TableHead className="min-w-[120px] whitespace-nowrap font-semibold sticky left-[120px] z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] py-1">Project ID</TableHead>}
                    {reportColumnPrefs.isColumnVisible('reportUrl') && <TableHead className="py-1">Report URL</TableHead>}
                    {reportColumnPrefs.isColumnVisible('reportReleaseDate') && <TableHead className="py-1">Report release Date</TableHead>}
                    {reportColumnPrefs.isColumnVisible('organisationHospital') && <TableHead className="py-1">Organisation / Hospital</TableHead>}
                    {reportColumnPrefs.isColumnVisible('clinicianResearcherName') && <TableHead className="py-1">Clinician / Researcher Name</TableHead>}
                    {reportColumnPrefs.isColumnVisible('clinicianResearcherEmail') && <TableHead className="py-1">Clinician / Researcher Email</TableHead>}
                    {reportColumnPrefs.isColumnVisible('clinicianResearcherPhone') && <TableHead className="py-1">Clinician / Researcher Phone</TableHead>}
                    {reportColumnPrefs.isColumnVisible('clinicianResearcherAddress') && <TableHead className="py-1">Clinician / Researcher Address</TableHead>}
                    {reportColumnPrefs.isColumnVisible('patientClientName') && <TableHead className="py-1">Patient / Client Name</TableHead>}
                    {reportColumnPrefs.isColumnVisible('age') && <TableHead className="py-1">Age</TableHead>}
                    {reportColumnPrefs.isColumnVisible('gender') && <TableHead className="py-1">Gender</TableHead>}
                    {reportColumnPrefs.isColumnVisible('patientClientEmail') && <TableHead className="py-1">Patient / Client Email</TableHead>}
                    {reportColumnPrefs.isColumnVisible('patientClientPhone') && <TableHead className="py-1">Patient / Client Phone</TableHead>}
                    {reportColumnPrefs.isColumnVisible('patientClientAddress') && <TableHead className="py-1">Patient / Client Address</TableHead>}
                    {reportColumnPrefs.isColumnVisible('geneticCounselorRequired') && <TableHead className="py-1">Genetic Counselling Required</TableHead>}
                    {reportColumnPrefs.isColumnVisible('nutritionalCounsellingRequired') && <TableHead className="py-1">Nutritional Counselling Required</TableHead>}
                    {reportColumnPrefs.isColumnVisible('serviceName') && <TableHead className="py-1">Service Name</TableHead>}
                    {reportColumnPrefs.isColumnVisible('tat') && <TableHead className="py-1">TAT (Days)</TableHead>}
                    {reportColumnPrefs.isColumnVisible('sampleType') && <TableHead className="py-1">Sample Type</TableHead>}
                    {reportColumnPrefs.isColumnVisible('noOfSamples') && <TableHead className="py-1">No of Samples</TableHead>}
                    {reportColumnPrefs.isColumnVisible('sampleId') && <TableHead className="py-1">Sample ID</TableHead>}
                    {reportColumnPrefs.isColumnVisible('sampleReceivedDate') && <TableHead className="py-1">Sample Received Date</TableHead>}
                    {reportColumnPrefs.isColumnVisible('progenicsTrf') && <TableHead className="py-1">Progenics TRF</TableHead>}
                    {reportColumnPrefs.isColumnVisible('approvalFromFinance') && <TableHead className="py-1">Approveal from Finance</TableHead>}
                    {reportColumnPrefs.isColumnVisible('salesResponsiblePerson') && <TableHead className="py-1">Sales / Responsible Person</TableHead>}
                    {reportColumnPrefs.isColumnVisible('leadCreatedBy') && <TableHead className="py-1">Lead Created</TableHead>}
                    {reportColumnPrefs.isColumnVisible('leadModified') && <TableHead className="py-1">Lead Modified</TableHead>}
                    {reportColumnPrefs.isColumnVisible('remarkComment') && <TableHead className="py-1">Remark / Comment</TableHead>}
                    {reportColumnPrefs.isColumnVisible('gcCaseSummary') && <TableHead className="py-1">GC case Summary</TableHead>}
                    {reportColumnPrefs.isColumnVisible('actions') && <TableHead className="sticky right-0 z-40 bg-white dark:bg-gray-900 min-w-[120px] border-l-2 actions-column py-1">Actions</TableHead>}
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
