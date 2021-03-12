/**
 * Module Description
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * 
 * Author: Anesu Chakaingesu    
 *
 * NSVersion  Date                      Last Modified time                      
 * 2.00       2021-03-05 09:00:00       2021-03-05 17:00:00           
 *
 * Remarks: Schedule Script to the set the Date Review Field.
 *
 */


define(['N/runtime', 'N/search', 'N/record', 'N/log', 'N/task', 'N/currentRecord', 'N/format'],
    function(runtime, search, record, log, task, currentRecord, format) {
        
        var ctx = runtime.getCurrentScript();
        var usageThreshold = 50;
        var adhocInvDeploy = 'customdeploy2';
        var prevInvDeploy = null;

        /**
         * [setDateReview description] - Schedule Script to the set the Date Review Field.
         * @param {string} custscript_customerid Customer ID
         * @param {string} custscriptstart_date Invoicing Start date
         * @param {string} custscriptend_date Invoicing End Date
         */
        function setDateReview() {

            var customerID = ctx.getParameter({
                fieldId: 'custscript_customerid'
            });
            var zeeID = parseInt(ctx.getParameter({
                fieldId: 'custscriptzee_id'
            }));
            var startDate = ctx.getParameter({
                fieldId: 'custscriptstart_date'
            });
            var endDate = ctx.getParameter({
                fieldId: 'custscriptend_date'
            });
            custscript_prevdeploy
            if (!isNullorEmpty(ctx.getParameter({ fieldId: 'custscript_prevdeploy' }))) {
                log.emergency({
                    title: 'Received Parameters',
                    details: 'Customer ID: ' + customerID
                })
                log.emergency({
                    title: 'Received Parameters',
                    details:  'Zee ID: ' + zeeID
                })
                
                log.emergency({
                    title: 'Received Parameters',
                    details: 'Start Date: ' + startDate
                })
                log.emergency({
                    title: 'Received Parameters',
                    details: 'End Date: ' + endDate
                })
                prevInvDeploy = ctx.getParameter({ fieldId: 'custscript_prevdeploy' });
            } else {
                log.emergency({
                    title: 'Received Parameters',
                    details: 'Customer ID: ' + customerID
                })
                log.emergency({
                    title: 'Received Parameters',
                    details:  'Zee ID: ' + zeeID
                })
                
                log.emergency({
                    title: 'Received Parameters',
                    details: 'Start Date: ' + startDate
                })
                log.emergency({
                    title: 'Received Parameters',
                    details: 'End Date: ' + endDate
                })
                prevInvDeploy = ctx.deploymentId;
            }

            log.audit({
                title: 'START --> Set Date Review | Customer: ' + customerID, 
                details:ctx.getRemainingUsage()
            });

            try {

                var zee_record = record.load({
                    type: 'partner',
                    id: zeeID
                });
                var zee_text = zee_record.getValue({ fieldId: 'entitytitle' });

                // Set the review date and the invoiceable field for each and every job
                var searchedJobs = search.load({ type: 'customrecord_job', id: 'customsearch_inv_review_jobs_uninv' });

                var newFilters = [];
                newFilters.push(['custrecord_job_customer', search.Operator.IS, customerID]);
                newFilters.push(["formulatext: COALESCE({custrecord_job_service.custrecord_service_franchisee},{custrecord_job_group.custrecord_jobgroup_franchisee},{custrecord_job_franchisee},'')", search.Operator.IS, zee_text]);
                if (!isNullorEmpty(startDate) && !isNullorEmpty(endDate)) {
                    newFilters.push(['custrecord_job_date_scheduled', search.Operator.ONORAFTER, format.parse({
                        value: startDate,
                        type: format.Type.DATE
                    })]); 
                    newFilters.push(['custrecord_job_date_scheduled', search.Operator.ONORBEFORE, format.parse({
                        value: endDate,
                        type: format.Type.DATE
                    })]);
                }
                searchedJobs.filterExpression = newFilters;
                var resultSet = searchedJobs.run();

                resultSet.each(function(searchResult) {
                    var usageStart = ctx.getRemainingUsage();

                    if (usageStart <= usageThreshold) {

                        log.debug({
                            title: 'SWITCHing -->',
                            details: ctx.getRemainingUsage()
                        })

                        var params = {
                            custscript_customerid: customerID,
                            custscriptzee_id: zeeID,
                            custscript_prevdeploy: ctx.getDeploymentId(),
                            custscriptstart_date: startDate,
                            custscriptend_date: endDate
                        }

                        log.emergency({
                            title: 'Parameters Passed',
                            details: 'Customer ID: ' + customerID
                        })
                        log.emergency({
                            title: 'Parameters Passed',
                            details:  'Zee ID: ' + zeeID
                        })
                        
                        log.emergency({
                            title: 'Parameters Passed',
                            details: 'Start Date: ' + startDate
                        })
                        log.emergency({
                            title: 'Parameters Passed',
                            details: 'End Date: ' + endDate
                        });

                        var reschedule = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            deploymentId: adhocInvDeploy,
                            params: params,
                            scriptId: prevInvDeploy
                        });
                        if (reschedule == false) {
                            return false;
                        }
                    }

                    // nlapiLogExecution('AUDIT', 'Set Date Review | Customer: ' + customerID, ctx.getRemainingUsage());

                    try {

                        var jobRecord = record.load({
                            type: 'customrecord_job',
                            id: searchResult.getValue({ name: 'internalid' })
                        });

                        var jobGroupStatus = jobRecord.getValue({ fieldId: 'custrecord_job_group_status' });
                        var jobInvoiceable = jobRecord.getValue({ fieldId: 'custrecord_job_invoiceable' });
                        var jobCat = jobRecord.getValue({ fieldId: 'custrecord_job_service_category' });
                        var packageStatus = jobRecord.getValue({ fieldId: 'custrecord_package_status' });
                        var jobGroupSource = jobRecord.getValue({ fieldId: 'custrecord_job_source' });

                        if (isNullorEmpty(jobInvoiceable)) {

                            if (!isNullorEmpty(packageStatus)) {
                                if (packageStatus == 1 || isNullorEmpty(packageStatus)) {
                                    // Job Group Status is Null for Extras and Jobs Created in NS
                                    jobRecord.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                                } else if (packageStatus == 3 || packageStatus == 2) {
                                    jobRecord.setValue({ fieldId: 'custrecord_job_invoiceable', value: 2 });
                                } else {
                                    // If the Job Group Status is Scheduled, Invoiceable does not get set to anything
                                }
                            } else {
                                if (jobGroupStatus == 'Completed' || (isNullorEmpty(jobGroupStatus) && jobGroupSource == 5) || jobCat != '1') {
                                    // Job Group Status is Null for Extras and Jobs Created in NS
                                    jobRecord.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                                } else {
                                    jobRecord.setValue({ fieldId: 'custrecord_job_invoiceable', value: 2 });
                                }

                                // 
                                // } else if (jobGroupStatus == 'Incomplete' || jobGroupStatus == 'Partial') {
                                //     jobRecord.setValue({ fieldId: 'custrecord_job_invoiceable', value: 2 });
                                // } else {
                                //     // If the Job Group Status is Scheduled, Invoiceable does not get set to anything to allow users to review any scheduled jobs upto end of month before setting invoiceable to NO when FINALISE button is clicked.  
                                // }
                            }

                        }

                        var getDateNetsuite = format.format({
                            value: getDate(),
                            type: format.Type.DATE
                        });
                        jobRecord.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDateNetsuite});
                        jobRecord.save();

                        log.debug({
                            title: 'Set Date Review | Job: ' + searchResult.getValue('internalid'),
                            details: usageStart - ctx.getRemainingUsage()
                        });

                        return true;
                    } catch (e) {
                        var message = '';
                        message += "Customer Internal ID: " + customerID + "</br>";
                        message += "Customer:  <a href ='https://1048144.app.netsuite.com/app/common/entity/custjob.nl?id=" + customerID + "'> View Customer </a></br>";
                        message += "----------------------------------------------------------------------------------</br>";
                        message += "Job: <a href ='https://1048144.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=941&id=" + searchResult.getValue('internalid') + "'> View Job</a></br>";
                        message += "----------------------------------------------------------------------------------</br>";
                        message += e;

                        email.send({
                            author: 409635,
                            body: message,
                            recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                            subject: 'AIC - Review - Date Review (SC) - Unable to update Job'
                        });
                    }
                });

                //Unset the AIC Date Reviwed Field once all the jobs associated with the customer has been reviewed.
                var recCustomer = record.load({
                    type: 'customer',
                    id: customerID
                });
                recCustomer.setValue({ fieldId: 'custentity_aic_date_reviewed', id: null});
                recCustomer.save();

                log.audit({
                    title: 'END --> Set Date Review | Customer: ' + customerID,
                    details: ctx.getRemainingUsage()
                });

            } catch (e) {
                var message = '';
                message += e;

                email.send({
                    author: 409635,
                    body: message,
                    recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                    subject: 'AIC - Review - Date Review (SC) - Unable to run the script'
                });
            }
        }

        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }

        return {
            execute: setDateReview
        }
});