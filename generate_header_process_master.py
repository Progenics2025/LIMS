import re

content = """
                  {processMasterColumnPrefs.isColumnVisible('uniqueId') && <TableHead className="whitespace-nowrap sticky left-0 z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] py-1">Unique ID</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('projectId') && <TableHead className="whitespace-nowrap sticky left-[120px] z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] py-1">Project ID</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('sampleId') && <TableHead className="whitespace-nowrap py-1">Sample ID</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('clientId') && <TableHead className="whitespace-nowrap py-1">Client ID</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('organisationHospital') && <TableHead className="whitespace-nowrap py-1">Organisation/Hospital</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('clinicianResearcherName') && <TableHead className="whitespace-nowrap py-1">Clinician/Researcher name</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('specialty') && <TableHead className="whitespace-nowrap py-1">Speciality</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('clinicianResearcherEmail') && <TableHead className="whitespace-nowrap py-1">Clinician/Researcher Email</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('clinicianResearcherPhone') && <TableHead className="whitespace-nowrap py-1">Clinician/Researcher Phone</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('clinicianResearcherAddress') && <TableHead className="whitespace-nowrap py-1">Clinician/Researcher address</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('patientClientName') && <TableHead className="whitespace-nowrap py-1">Patient/Client name</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('age') && <TableHead className="whitespace-nowrap py-1">Age</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('gender') && <TableHead className="whitespace-nowrap py-1">Gender</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('patientClientEmail') && <TableHead className="whitespace-nowrap py-1">Patient/Client email</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('patientClientPhone') && <TableHead className="whitespace-nowrap py-1">Patient/Client phone</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('patientClientAddress') && <TableHead className="whitespace-nowrap py-1">Patient/Client address</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('sampleCollectionDate') && <TableHead className="whitespace-nowrap py-1">Sample collection date</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('sampleReceivedDate') && <TableHead className="whitespace-nowrap py-1">Sample recevied date</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('serviceName') && <TableHead className="whitespace-nowrap py-1">Service name</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('sampleType') && <TableHead className="whitespace-nowrap py-1">Sample Type</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('noOfSamples') && <TableHead className="whitespace-nowrap py-1">No of Samples</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('tat') && <TableHead className="whitespace-nowrap py-1">TAT</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('salesResponsiblePerson') && <TableHead className="whitespace-nowrap py-1">Sales/Responsible person</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('progenicsTrf') && <TableHead className="whitespace-nowrap py-1">Progenics TRF</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('thirdPartyTrf') && <TableHead className="whitespace-nowrap py-1">Third Party TRF</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('progenicsReport') && <TableHead className="whitespace-nowrap py-1">Progenics Report</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('sampleSentToThirdPartyDate') && <TableHead className="whitespace-nowrap py-1">Sample Sent To Third Party Date</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('thirdPartyName') && <TableHead className="whitespace-nowrap py-1">Third Party Name</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('thirdPartyReport') && <TableHead className="whitespace-nowrap py-1">Third Party Report</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('resultsRawDataReceivedFromThirdPartyDate') && <TableHead className="whitespace-nowrap py-1">Results/Raw Data Received From Third Party Date</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('logisticStatus') && <TableHead className="whitespace-nowrap py-1">Logistic Status</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('financeStatus') && <TableHead className="whitespace-nowrap py-1">Finance Status</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('labProcessStatus') && <TableHead className="whitespace-nowrap py-1">Lab Process Status</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('bioinformaticsStatus') && <TableHead className="whitespace-nowrap py-1">Bioinformatics Status</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('nutritionalManagementStatus') && <TableHead className="whitespace-nowrap py-1">Nutritional Management Status</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('progenicsReportReleaseDate') && <TableHead className="whitespace-nowrap py-1">Progenics Report Release Date</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('remarkComment') && <TableHead className="whitespace-nowrap py-1">Remark/Comment</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('modifiedBy') && <TableHead className="whitespace-nowrap py-1">Modified By</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('modifiedAt') && <TableHead className="whitespace-nowrap py-1">Modified At</TableHead>}
                  {processMasterColumnPrefs.isColumnVisible('actions') && <TableHead className="actions-column whitespace-nowrap py-1 sticky right-0 z-40 bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700">Actions</TableHead>}
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
