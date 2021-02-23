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
        var role = 0;

        var usage_threshold = 20;
        var usage_threshold_invoice = 1000;
        var adhoc_inv_deploy = 'customdeploy2';
        var prev_inv_deploy = null;
        var ctx = runtime.getCurrentScript();

        var service_start_date;
        var service_end_date;
        var franchisee;
        var from_invoice = null;
        var count_loop_cust = 0;

        function invoiceCreation() {
            if (!isNullorEmpty(ctx.getParameter({name: 'custscript_deployment_prev'}))) {
                prev_inv_deploy = ctx.getParameter({name: 'custscript_deployment_prev'});
            } else {
                prev_inv_deploy = ctx.deploymentId;
            }

            if (!isNullorEmpty(ctx.getParameter({name: 'custscript_id_customer'}) && !isNullorEmpty(ctx.getParameter({name: 'custscript_id_invoice'})))) {
                service_start_date = ctx.getParameter({name: 'custscript_service_start'});
                service_end_date = ctx.getParameter({name: 'custscript_service_end'});
                franchisee = ctx.getParameter({name: 'custscript_id_zee'});
                from_invoice = ctx.getParameter({name: 'custscript_custom_invoice'});
        
                var result = updateJobs(ctx.getParameter({name: 'custscript_id_customer'}), ctx.getParameter({name: 'custscript_id_invoice'}), service_start_date, service_end_date, franchisee, from_invoice);
                if (result == true) {
                    var params = {
                        custscript_prev_deployment: ctx.deploymentId
                    }
        
                    var reschedule = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: prev_inv_deploy,
                        deploymentId: adhoc_inv_deploy,
                        params: params
                    });
                    
                    reschedule.submit();
                    
                    if (reschedule == false) {
                        return false;
                    }
                }
            }
        }

        function updateJobs(customer_internal_id, invoiceId, service_start_date, service_end_date, franchisee, from_invoice) {
            var count_loop_job = 0;

            log.debug({title: 'START ---> update job function', details: ctx.getRemainingUsage()});
            log.debug({ title: 'customer_internal_id | ' + customer_internal_id, details: ctx.getRemainingUsage() });
            log.debug({title: 'invoiceId | ' + invoiceId, details: ctx.getRemainingUsage() });
            log.debug({ title: 'service_end_date | ' + service_end_date, details: ctx.getRemainingUsage()});
            log.debug({ title: 'service_start_date | ' + service_start_date, details: ctx.getRemainingUsage()});
            log.debug({ title: 'from_invoice | ' + from_invoice, details: ctx.getRemainingUsage()});
            log.debug({ title: 'franchisee | ' + franchisee, details: ctx.getRemainingUsage()});

            if (from_invoice == 'Yes') {
                var searched_alljobs = search.load({
                    id: 'customsearch_job_invoicing_jobs',
                    type: 'customrecord_job'
                });
            } else {
                var searched_alljobs = search.load({
                    id: 'customsearch_job_inv_process_job_all',
                    type: 'customrecord_job'
                });
            }

            searched_alljobs.filters.push(search.createFilter({
                name: 'custrecord_job_customer',
                operator: search.Operator.IS,
                values: customer_internal_id,
            }));

            searched_alljobs.filters.push(search.createFilter({
                name: 'custrecord_job_franchisee',
                operator: search.Operator.IS,
                values: franchisee,
            }));


            if (!isNullorEmpty(service_start_date) && !isNullorEmpty(service_end_date)) {
                searched_alljobs.filters.push(search.createFilter({
                    name: 'custrecord_job_date_scheduled',
                    operator: search.Operator.ONORAFTER,
                    values: format.parse({value: service_start_date, type: format.Type.DATE })
                }));
                searched_alljobs.filters.push(search.createFilter({
                    name: 'custrecord_job_date_scheduled',
                    operator: search.Operator.ONORBEFORE,
                    values: format.parse({value: service_end_date, type: format.Type.DATE })
                }));
                
            }

            var resultSet_alljobs = searched_alljobs.run();

            resultSet_alljobs.each(function(searchResult_alljobs) {

                var usage_loopstart_job = ctx.getRemainingUsage();
                count_loop_job++;
                //nlapiLogExecution('DEBUG', 'START ---> usage remianing per loop of job update', ctx.getRemainingUsage());

                if (ctx.getRemainingUsage() <= usage_threshold) {

                    var params = {
                        custscript_id_customer: customer_internal_id,
                        custscript_id_invoice: invoiceId,
                        custscript_deployment_prev: ctx.deploymentId,
                        custscript_service_start: service_start_date,
                        custscript_id_zee: service_end_date,
                        custscript_zee: franchisee,
                        custscript_custom_invoice: 'Yes'
                    }

                    var reschedule = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: prev_inv_deploy,
                        deploymentId: adhoc_inv_deploy,
                        params: params
                    });
                    
                    reschedule.submit();
                    
                    if (reschedule == false) {
                        return false;
                    }

                }

                var job_id = searchResult_alljobs.getValue('internalid');
                var invoiceable_yes_no = searchResult_alljobs.getValue('custrecord_job_invoiceable');

                log.debug({
                    title: 'jobID',
                    details: job_id
                });

                var job_record = record.load({
                    type: 'customrecord_job',
                    id: job_id,
                });

                // job_record.getFieldValue('custrecord_job_date_invoiced') != getDate()
                if (isNullorEmpty(job_record.getValue({ fieldId: 'custrecord_job_date_invoiced' })) && isNullorEmpty(job_record.getValue({ fieldId: 'custrecord_job_invoice' }))) {

                    log.debug({
                        title: 'Inside',
                        details: 'Inside'
                    })

                    if (from_invoice == 'Yes') {

                        var jobGroupStatus = job_record.getFieldValue({ fieldId: 'custrecord_job_group_status' });
                        var jobInvoiceable = job_record.getFieldValue({ fieldId: 'custrecord_job_invoiceable' });
                        var jobCat = job_record.getFieldValue({ fieldId: 'custrecord_job_service_category' });
                        var packageStatus = job_record.getFieldValue({ fieldId: 'custrecord_package_status' });

                        if (isNullorEmpty(jobInvoiceable)) {
                            if (!isNullorEmpty(packageStatus)) {
                                if (packageStatus == 1 || isNullorEmpty(packageStatus)) {
                                    // Job Group Status is Null for Extras and Jobs Created in NS
                                    job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                                } else {
                                    job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 2 });
                                }
                            } else {
                                if (jobGroupStatus == 'Completed' || isNullorEmpty(jobGroupStatus)) {
                                    // Job Group Status is Null for Extras and Jobs Created in NS
                                    job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                                } else {
                                    job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 2 });
                                }
                            }
                        }
                        job_record.setValue({ fieldId: 'custrecord_job_invoice', value: invoiceId });
                        job_record.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate() });
                        job_record.setValue({ fieldId: 'custrecord_job_date_inv_finalised', value: getDate() });
                        job_record.setValue({ fieldId: 'custrecord_job_date_invoiced', value: getDate() });
                        job_record.setValue({ fieldId: 'custrecord_job_invoice_custom', value: 1 });
                    } 

                    log.debug({
                        title: 'Job #: ' + count_loop_job + ' | Job: ' + job_id + '.',
                        details: usage_loopstart_job - ctx.getRemainingUsage()
                    });

                    job_record.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    })

                    //WS Log:
                    

                } else {

                    var body = 'Customer: ' + customer_internal_id + ' | Job: ' + job_id + 'cannot be updated because Invoice ID and Date Invoice is not Empty.';
        
                    email.send({
                        author: 112209,
                        body: body,
                        recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                        subject: 'Invoice Creation - Customer: ' + customer_internal_id + ' cannot update Job',
                    });
        
                    //WS log:
                    log.error({
                        title: 'Job #: ' + count_loop_job + ' | Job: ' + job_id + '.',
                        details: 'ERROR: JOB X UPDATED - Inv & Date Invoice not empty.'
                    });
        
                    return false;
                }

                return true;
            });

            //WS Log:
            log.debug({
                title: '--> END | update job function',
                details: ctx.getRemainingUsage()
            });
            return true;
        
        }

        function getDate() {
            var date = new Date();
            date.setHours(date.getHours() + 17);
            date = format.format({
                value: date,
                type: format.Type.DATE
            })
        
            return date;
        }

        function invoice_date() {

            var date = new Date();
        
            var month = date.getMonth(); //Months 0 - 11
            var day = date.getDate();
            var year = date.getFullYear();
        
            //If allocator run on the first day of the month, it takes the last month as the filter
            if (day == 1 || day == 2 || day == 3 || day == 4 || day == 5) {
                if (month == 0) {
                    month = 11;
                    year = year - 1
                } else {
                    month = month - 1;
                }
            }
        
            // var firstDay = new Date(year, (month), 1);
            var lastDay = new Date(year, (month + 1), 0);
        
            return format.format({ value: lastDay, type: format.Type.DATE});

        }

        function service_start_end_date(date_finalised) {

            var split_date = date_finalised.split('/');
        
            var date = new Date();
            var firstDay = new Date(date.getFullYear(), parseInt(split_date[1]) - 1, 1);
            var lastDay = new Date(date.getFullYear(), split_date[1], 0);
        
        
        
            var service_range = [];
        
            service_range[0] = format.format({ value: firstDay, type: format.Type.DATE});
            service_range[1] = format.format({ value: lastDay, type: format.Type.DATE});
        
            return service_range;
        
        }

        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }
        
        role = runtime.getCurrentUser().role;

        return {
            execute: invoiceCreation
        }
    }
);