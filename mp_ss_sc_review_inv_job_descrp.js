/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * 
 * Module Description
 * 
 * @Last Modified by:   Sruti Desai
 * 
 */

define(['N/runtime', 'N/search', 'N/record', 'N/log', 'N/task', 'N/currentRecord', 'N/format'],
    function(runtime, search, record, log, task, currentRecord, format) {
        var zee = 0;
        var role = runtime.getCurrentUser().role;;
        var usageThreshold = 50;
        var adhocInvDeploy = 'customdeploy_adhoc';
        var prevInvDeploy = null;
        var ctx = runtime.getCurrentScript();
        
        
        function reviewDiscrepancyJobs() {
            var count_group = 0;
            var count_job = 0;
        
            if (!isNullorEmpty(ctx.getParameter({name: 'custscript_prevdeployid'}))) {
                prevInvDeploy = ctx.getParameter({name: 'custscript_prevdeployid'});
            } else {
                prevInvDeploy = ctx.deploymentId;
            }

            var resultSet_group1 = search.load({
                id: 'customsearch_job_inv_review_inv_discrep',
                type: 'customrecord_job'
            });

            var resultSet_group = resultSet_group1.run();

	        resultSet_group.each(function(group) {
                usageStart = ctx.getRemainingUsage();

                if (usageStart <= usageThreshold) {
        
                    log.debug({
                        title: 'SWITCHing -->',
                        details: ctx.getRemainingUsage()
                    });
        
                    var params = {
                        custscript_prevdeployid: ctx.deploymentId
                    }
        
        
                    var reschedule = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: prevInvDeploy,
                        deploymentId: adhocInvDeploy,
                        params: params
                    });
                    
                    reschedule.submit();
                    if (reschedule == false) {
                        return false;
                    }
                }

                count_group++;
                var all, yes, no, nullx, invoiceable;
                var job_group_id = group.getValue({ name: "internalid", join: "CUSTRECORD_JOB_GROUP",summary: search.Summary.GROUP });
                var job_group_status = group.getValue({ name: "custrecord_job_group_status", join: null, summary: search.Summary.GROUP});

                var cols = group.columns;
                cols.each(function(col) {
                    switch (col.getLabel()) {
                        case 'All':
                            all = group.getValue(col);
                            break;
                        case 'Yes':
                            yes = group.getValue(col);
                            break;
                        case 'No':
                            no = group.getValue(col);
                            break;
                        case 'Nullx':
                            nullx = group.getValue(col);
                            break;
                    }
                    return true;
                });

                if ((all - nullx) > 0) { //Not All Jobs Invoiceable null
                    if (job_group_status == "Completed") {
                        if (no > 0) {
                            invoiceable = 2; // No
                        } else {
                            invoiceable = 1; // Yes
                        }
                    } else if (job_group_status == "Incomplete" || job_group_status == "Partial" || job_group_status == "Scheduled" || isNullorEmpty(job_group_status)) {
                        if (yes > 0) {
                            invoiceable = 1; // Yes
                        } else {
                            invoiceable = 2; // No
                        }
                    }
                } else {
                    invoceable = null;
                }

                log.audit({
                    title: 'Loop# ' + count_group + ' | Job Group: ' + job_group_id + ' - ' + job_group_status, 'All: ' + all + ' Y: ' + yes + ' N: ' + no + ' null: ' + nullx + ' | Inv: ' + invoiceable,
                    details: 'Loop# ' + count_group + ' | Job Group: ' + job_group_id + ' - ' + job_group_status, 'All: ' + all + ' Y: ' + yes + ' N: ' + no + ' null: ' + nullx + ' | Inv: ' + invoiceable
                });

                if (!isNullorEmpty(job_group_id)) {
                    //Run Job Search
                    var job_search = search.load({
                        id: 'customsearch_job_invoicing_jobs',
                        type: 'customrecord_job'
                    });

                    job_search.filters.push(search.createFilter({
                        name: 'custrecord_job_group',
                        operator: search.Operator.ANYOF,
                        values: job_group_id,
                        
                    }));
        
                    job_search.filters.push(search.createFilter({
                        name: 'custrecord_job_service_category',
                        operator: search.Operator.ANYOF,
                        values: [1],
                        
                    })); // Services
        
        
                    var resultSet_job = job_search.run();
                    // TO BE ADDED
                    // Need to Incorporate the consideration for package re-allocation
                    // if packaged,
                    // nullify service package, pkg job groups, date last allocated and pkg status for existing jobs
                    // find all related jobs of the job group ids packaged filtering out existing jobs
                    // nullify service package, pkg job groups, date last allocated and pkg status for the other jobs

                    // var job_ids_pkg = [];

                    // Update Jobs
                    resultSet_job.each(function(job) {
                        count_job++;
                        var job_id = job.getValue('internalid');
                        var job_invoiceable = job.getValue('custrecord_job_invoiceable');
                        // var job_pkg = job.getValue('custrecord_job_service_package'); to include in search
                        // var job_pkg_groups = job.getValue('custrecord_package_job_groups'); to include in search
                        if (!isNullorEmpty(invoiceable) && (invoiceable != job_invoiceable)) {
                            var job_record = record.load({
                                type: 'customrecord_job',
                                id: job_id
                            })
                            job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: invoiceable });
        
                            // to be incorporated
                            // job_record.setFieldValue('custrecord_job_service_package', null);
                            // job_record.setFieldValue('custrecord_package_job_groups', null);
                            // job_record.setFieldValue('custrecord_job_date_allocated', null);
                            // job_record.setFieldValue('custrecord_package_status', null);
        
                            job_record.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            }); //might need to move for package

                            log.debug({
                                title: 'Group# - Job#: ' + count_group + ' - ' + count_job + ' | Job : ' + job_id,
                                details: 'Job Inv: ' + job_invoiceable + ' | Inv: ' + invoiceable + '. UPDATED.'
                            });


                        } else {
                            log.debug({
                                title: 'Group# - Job#: ' + count_group + ' - ' + count_job + ' | Job : ' + job_id,
                                details: 'Job Inv: ' + job_invoiceable + ' | Inv: ' + invoiceable + '. SKIPPED.'
                            });
                        }
                        // DEPRECATED
                        // Assumes that discrepancies are caused by one job being Yes and the other being No
                        // Bug: Does not consider that discrepancies can be caused by null and Yes/No

                        // if (job_group_status == 1) { // Job Group Status == Complete
                        // 	invoiceable_status = 2 // Invoiceable = No
                        // } else if (job_group_status == 2 || job_group_status == 3) { // Job Group Status == Incomplete or Partial
                        // 	invoiceable_status = 1 // Invoiceable = Yes
                        // }

                        return true;
                    });
                }
                return true;
            });
        }

        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }
        
        return {
            execute: reviewDiscrepancyJobs
        }
    }
);