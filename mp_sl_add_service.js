/**
 * 
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * 
 * Description: 
 * @Last Modified by: Sruti Desai
 * 
 */


 define(['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/search', 'N/record', 'N/http', 'N/log', 'N/redirect', 'N/format'], 
 function(ui, email, runtime, search, record, http, log, redirect, format) {
     var baseURL = 'https://1048144.app.netsuite.com';
     if (runtime.EnvType == "SANDBOX") {
         baseURL = 'https://1048144-sb3.app.netsuite.com';
     }
     var zee = 0;
     var role = runtime.getCurrentUser().role;
     if (role == 1000) {
         //Franchisee
         zee = runtime.getCurrentUser();
     } else if (role == 3) { //Administrator
        zee = 6; //test
    } else if (role == 1032) { // System Support
        zee = 425904; //test-AR
    }
 
    var ctx = runtime.getCurrentScript();

    /**
     * [add_service description] - Add Services from the Review Page. Script used for both Add Services as well as Add Extras.
     * @param  {String} request  when the page is loaded
     * @param  {String} response when the page is submitted
     */

    function onRequest(context) {  
        
        if (context.request.method === 'GET') {
            zee = context.request.parameters.zee;

            var customer_record = record.load({
                type: record.Type.CUSTOMER,
                id: context.request.parameters.custid,
            })

            // zee = parseInt(request.getParameter('zee'));

            /**
             * [if description] - If services, search: Job - Service - Add Services
             */
            if (context.request.parameters.service_cat == '1') {
                var form =  ui.createForm({
                    title: 'Services: ' + customer_record.getValue({ fieldId: 'entityid' }) + ' ' + customer_record.getValue({ fieldId: 'companyname' })
                });

                var searched_jobs = search.load({
                    id: 'customsearch_service_invoicing_add_srvc',
                    type: 'customrecord_service'
                });

            } else {
                var form = ui.createForm({
                    title: 'Extras: ' + customer_record.getValue({ fieldId: 'entityid' }) + ' ' + customer_record.getValue({ fieldId: 'companyname' })
                });
               
                
                /**
                 * If extras, search: Job - Service - Add Extras
                 */

                var searched_jobs = search.load({
                    id: 'customsearch_service_invoicing_add_srv_2',
                    type: 'customrecord_service'
                });
            }

            var pricing_subTab = form.addFieldGroup({ id: 'custom_pricing', label: 'Service Pricing' });
            form.addField({ 
                id: 'start_date', 
                type: ui.FieldType.TEXT, 
                label: 'start_date' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = context.request.parameters.start_date;
            
            form.addField({ 
                id: 'end_date', 
                type: ui.FieldType.TEXT, 
                label: 'end_date' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = context.request.parameters.end_date;

            form.addField({ 
                id: 'extra_service_string', 
                type: ui.FieldType.TEXT, 
                label: 'extra_service_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'extra_qty_string', 
                type: ui.FieldType.TEXT, 
                label: 'extra_qty_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'extra_rate_string', 
                type: ui.FieldType.TEXT, 
                label: 'extra_rate_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'delete_job_id_string', 
                type: ui.FieldType.TEXT, 
                label: 'delete_job_id_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });
            
            log.debug({
                title: 'zee',
                details: zee
            });

            form.addField({ 
                id: 'zee_id', 
                type: ui.FieldType.TEXT, 
                label: 'delete_job_id_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = zee;

            form.addField({ 
                id: 'new_jobs_service_id_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_jobs_service_id_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'new_jobs_rate_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_jobs_rate_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'new_jobs_qty_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_jobs_qty_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'new_jobs_cat_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_jobs_cat_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'new_jobs_descp_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_jobs_descp_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            //New Services to be created from the client
            form.addField({ 
                id: 'new_service_type_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_service_type_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'new_service_name_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_service_name_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'new_service_price_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_service_price_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'new_service_qty_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_service_qty_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'new_service_customer_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_service_customer_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'new_service_comm_reg_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_service_comm_reg_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'new_service_descp_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_service_descp_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            form.addField({ 
                id: 'new_service_cat_string', 
                type: ui.FieldType.TEXT, 
                label: 'new_service_cat_string' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });


            searched_jobs.filters.push(search.createFilter({
                name: 'custrecord_service_customer',
                operator: search.Operator.ANYOF,
                values: context.request.parameters.custid,
            }));

    
            if (context.request.parameters.service_cat == '3') {
                searched_jobs.filters.push(search.createFilter({
                    name: 'custrecord_service_package',
                    operator: search.Operator.ANYOF,
                    values: '@NONE@',
                }));

                searched_jobs.filters.push(search.createFilter({
                    name: 'custrecord_service_category',
                    operator: search.Operator.ANYOF,
                    values: [2, 3],
                }));

                searched_jobs.filters.push(search.createFilter({
                    name: 'custrecord_service_franchisee',
                    operator: search.Operator.ANYOF,
                    values: [zee, "@NONE@"],
                }));
               
            } else {
                searched_jobs.filters.push(search.createFilter({
                    name: 'custrecord_service_franchisee',
                    operator: search.Operator.ANYOF,
                    values: zee,
                }));
            }    
        
            var resultSet = searched_jobs.run();

            /**
             * [if description] - Based on the Service Category, the heading for the sublists change
             */
            if (context.request.parameters.service_cat == '3') {
                form.addTab({ id: 'custom_pricing', label: 'Standard / Used Extras' });
                form.addTab({ id: 'custom_new_pricing', label: 'Custom Extras'});
                form.addSubtab({ id: 'custpage_pricing', label: 'Standard / Extras', tab: 'custom_pricing' });
                form.addSubtab({ id: 'custpage_new_pricing', label: 'Custom Extras', tab:'custom_new_pricing'});
            } else {
                form.addTab({ id: 'custom_pricing', label: 'Existing / Used Services' });
                form.addTab({ id: 'custom_new_pricing', label: 'New Services' });
                form.addSubtab({ id: 'custpage_pricing', label: 'Existing / Used  Services', tab:'custom_pricing'});
                form.addSubtab({ id: 'custpage_new_pricing', label: 'New Services', tab:'custom_new_pricing'});
            }

            form.addField({ 
                id: 'customer', 
                type: ui.FieldType.SELECT, 
                label: 'Company', 
                source: 'customer', 
                group: 'main' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = context.request.parameters.custid;

            form.addField({ 
                id: 'service_cat', 
                type: ui.FieldType.TEXT, 
                label: 'Category' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = context.request.parameters.service_cat;

            
            var sublistPricing = form.addSublist({ 
                id: 'services',
                label: 'Services / Extras', 
                tab: 'custpage_pricing',
                type: 'editor'
            });

            sublistPricing.addField({ 
                id: 'service_record_internalid', 
                type: ui.FieldType.INTEGER, 
                label: 'InternalID' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            sublistPricing.addField({ 
                id: 'service_category', 
                type: ui.FieldType.INTEGER, 
                label: 'Service Category' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });
            var service_type = sublistPricing.addField({ 
                id: 'item', 
                type: ui.FieldType.SELECT, 
                label: 'Item' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.DISABLED
            });

           
            service_type.isMandatory = true;


            
            service_type.addSelectOption({ value: '', text: '' });
            if (context.request.parameters.service_cat == '1') {
                var service_typeSearch = serviceTypeSearch(null, [1]);
            } else {
                var service_typeSearch = serviceTypeSearch(null, [2, 3]);
            }

            serviceTypeLoop(service_typeSearch, service_type);

            sublistPricing.addField({ 
                id: 'itemdescp', 
                type: ui.FieldType.TEXT, 
                label: 'Description' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.DISABLED
            })
            var itemprice_field = sublistPricing.addField({ 
                id: 'itemprice', 
                type: ui.FieldType.CURRENCY, 
                label: 'Price (ex GST)'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.DISABLED
            });
            
           
        
            itemprice_field.isMandatory = true;
                        
            var itemqty_field = sublistPricing.addField({ 
                id: 'itemqty', 
                type: ui.FieldType.TEXT, 
                label: 'App Quantity'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.DISABLED
            }).defaultValue = '0';

            
            itemqty_field.isMandatory = true;

            var itemaddqty_field = sublistPricing.addField({ 
                id: 'itemaddqty', 
                type: ui.FieldType.INTEGER, 
                label: 'Additional Quantity'
            });

            
        
            itemaddqty_field.isMandatory = true;

            sublistPricing.addField({ 
                id: 'old_itemaddqty', 
                type: ui.FieldType.INTEGER, 
                label: 'Old Additional Quantity'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            var i = 0;

            resultSet.each(function(searchResult) {

                var searched_jobs_2 = search.load({
                    id: 'customsearch_job_invoicing_mainpage',
                    type: 'customrecord_job'
                });

                var service_record_id = searchResult.getValue('internalid');

                var zee_record = record.load({
                    type: record.Type.PARTNER,
                    id: zee,
                });

                var zee_text = zee_record.getValue({ fieldId: 'entitytitle' });

                var strFormula = "COALESCE({custrecord_job_service.custrecord_service_franchisee},{custrecord_job_group.custrecord_jobgroup_franchisee},{custrecord_job_franchisee},'')";


                searched_jobs_2.filters.push(search.createFilter({
                    name: 'custrecord_job_customer',
                    operator: search.Operator.IS,
                    values: context.request.parameters.custid
                }));

                searched_jobs_2.filters.push(search.createFilter({
                    name: 'custrecord_job_service',
                    operator: search.Operator.IS,
                    values: searchResult.getValue('internalid')
                }));

                if (!isNullorEmpty(context.request.parameters.start_date) && !isNullorEmpty(context.request.parameters.end_date)) {
                    searched_jobs_2.filters.push(search.createFilter({
                        name: 'custrecord_job_date_scheduled',
                        operator: search.Operator.ONORAFTER,
                        values: format.format({ value: context.request.parameters.start_date, type: format.Type.DATE })
                    }));

                    searched_jobs_2.filters.push(search.createFilter({
                        name: 'custrecord_job_date_scheduled',
                        operator: search.Operator.ONORBEFORE,
                        values: format.format({ value: context.request.parameters.end_date, type: format.Type.DATE })
                    }));
                    
                }
                if (context.request.parameters.service_cat == 3) {
                    searched_jobs_2.filters.push(search.createFilter({
                        name: 'custrecord_job_service_category',
                        operator: search.Operator.ANYOF,
                        values: [2, 3]
                    }));

                } else {
                    searched_jobs_2.filters.push(search.createFilter({
                        name: 'custrecord_job_service_category',
                        operator: search.Operator.IS,
                        values: context.request.parameters.service_cat
                    }));

                }

                searched_jobs_2.filters.push(search.createFilter({
                    name: 'formulatext',
                    operator: search.Operator.IS,
                    values: zee_text,
                    formula: strFormula
                }));


                var resultSet_2 = searched_jobs_2.run();

                var total_qty = 0;
                var extra_total_qty = 0;

                resultSet_2.each(function(searchResult_2) {

                    var service_qty = (searchResult_2.getValue({ name: 'formulacurrency', join: null, summary: search.Summary.count }));

                    var service_status = searchResult_2.getValue({ name: 'custrecord_jobgroup_status', join: 'CUSTRECORD_JOB_GROUP', summary: search.Summary.GROUP });
                    var extra_service_qty = (searchResult_2.getValue({ name: 'custrecord_job_extras_qty', join: null, summary: search.Summary.SUM }));
                    var job_source = searchResult_2.getValue({ name: 'custrecord_job_source', join: null, summary: search.Summary.GROUP });

                    var invoiceable = searchResult_2.getValue({ name: 'custrecord_job_invoiceable', join: null, summary: search.Summary.GROUP });

                    log.debug({
                        title: 'service_qty',
                        details: service_qty
                    });

                    log.debug({
                        title: 'extra_service_qty',
                        details: extra_service_qty
                    });


                    if (invoiceable == 1 || (isNullorEmpty(invoiceable) && service_status == 1)) {
                        if (isNullorEmpty(extra_service_qty)) {
                            if (!isNullorEmpty(service_qty)) {
                                total_qty = parseInt(total_qty) + parseInt(service_qty);
                            }
                        } else {

                            if (job_source != 5) {
                                if (!isNullorEmpty(extra_service_qty)) {
                                    total_qty = parseInt(total_qty) + parseInt(extra_service_qty);
                                }
                            } else {
                                if (!isNullorEmpty(extra_service_qty)) {
                                    extra_total_qty = parseInt(extra_total_qty) + parseInt(extra_service_qty);
                                }
                            }
                        }
                    }
                    return true;
                });


                log.debug({
                    title: 'abcde',
                    details: searchResult.getValue('internalid')
                });
                log.debug({
                    title: 'i',
                    details: searchResult.getValue('custrecord_service_description')
                });
                sublistPricing.setSublistValue({ id: 'service_record_internalid', line: i, value: searchResult.getValue('internalid') });
                sublistPricing.setSublistValue({ id: 'service_category', line: i, value: searchResult.getValue('custrecord_service_category') });
                sublistPricing.setSublistValue({ id: 'item', line: i, value: searchResult.getValue('custrecord_service') });

                if (!isNullorEmpty(searchResult.getValue('custrecord_service_description'))) {
                    sublistPricing.setSublistValue({ id: 'itemdescp', line: i, value: searchResult.getValue('custrecord_service_description') });

                }
                sublistPricing.setSublistValue({ id: 'itemprice', line: i, value: searchResult.getValue('custrecord_service_price') });
                sublistPricing.setSublistValue({ id: 'itemqty', line: i, value: String(total_qty) });
                sublistPricing.setSublistValue({ id: 'itemaddqty', line: i, value: String(extra_total_qty) });
                sublistPricing.setSublistValue({ id: 'old_itemaddqty', line: i, value: String(extra_total_qty) });

                
                i++;
                return true;
            });

            sublistPricing.addField({ id: 'deletepricing', type: ui.FieldType.TEXT, label: 'Deleted Pricing' }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });


            
            var sublistNewPricing = form.addSublist({ id: 'new_services', type: 'inlineeditor', label: 'Services', tab: 'custpage_new_pricing' });
            sublistNewPricing.addField({ id: 'new_service_record_internalid', type: ui.FieldType.INTEGER , label: 'InternalID' }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });
            var service_type = sublistNewPricing.addField({ id: 'new_item', type: ui.FieldType.SELECT , label: 'Item' });
            
            service_type.isMandatory = true;

            service_type.addSelectOption({ value: '', text: '' });
            if (context.request.parameters.service_cat != '1') {
                var service_typeSearch = serviceTypeSearch(null, [3]);
            }

            serviceTypeLoop(service_typeSearch, service_type);

            sublistNewPricing.addField({ id: 'new_description', type: 'text', label: 'Service Description' });
            var new_itemprice_field = sublistNewPricing.addField({ id: 'new_itemprice', type: 'currency', label: 'Price (ex GST)' });
            var new_itemaddqty_field = sublistNewPricing.addField({ id: 'new_itemaddqty', type: 'text', label: 'New Quantity' });

            
        
            new_itemprice_field.isMandatory = true;

            
        
            new_itemaddqty_field.isMandatory = true;

            if (context.request.parameters.service_cat == '1') {
                form.addSubmitButton({
                    label: 'Add Services'
                });

            } else {
                form.addSubmitButton({
                    label: 'Add Extras'
                });
            }

            
            form.addButton({ id: 'cust_back', label: 'Back', functionName: 'onclick_Back()' });
            form.addButton({ id: 'cust_back', label: 'Reset', functionName: 'onclick_reset()' });
            

            //form.setScript('customscript_cl_add_service');
            form.clientScriptFileId = 4736785; //PROD = "". SB = ""
            context.response.writePage(form);
    
        } else {

            var internal_id = context.request.parameters.customer;
            var extra_service_string = context.request.parameters.extra_service_string;
            var extra_qty_string = context.request.parameters.extra_qty_string;
            var extra_rate_string = context.request.parameters.extra_rate_string;
            var delete_job_id_string = context.request.parameters.delete_job_id_string;

            log.debug({
                title: 'delete1',
                details: delete_job_id_string
            })

            var recCustomer = record.load({
                type: record.Type.CUSTOMER,
                id: internal_id,
            })

            var extra_service = extra_service_string.split(',');
            var extra_qty = extra_qty_string.split(',');
            var extra_rate = extra_rate_string.split(',');
            var delete_job_id = delete_job_id_string.split(',');

            //Get the New Jobs values
            var new_jobs_service_id_string = context.request.parameters.new_jobs_service_id_string;
            var new_jobs_rate_string = context.request.parameters.new_jobs_rate_string;
            var new_jobs_qty_string = context.request.parameters.new_jobs_qty_string;
            var new_jobs_cat_string = context.request.parameters.new_jobs_cat_string;
            var new_jobs_descp_string = context.request.parameters.new_jobs_descp_string;


            //Get the New Services values
            var new_service_type_string = context.request.parameters.new_service_type_string;
            var new_service_name_string = context.request.parameters.new_service_name_string;
            var new_service_price_string = context.request.parameters.new_service_price_string;
            var new_service_qty_string = context.request.parameters.new_service_qty_string;
            var new_service_customer_string = context.request.parameters.new_service_customer_string;
            var new_service_comm_reg_string = context.request.parameters.new_service_comm_reg_string;
            var new_service_descp_string = context.request.parameters.new_service_descp_string;
            var new_service_cat_string = context.request.parameters.new_service_cat_string;

            if (!isNullorEmpty(new_jobs_service_id_string)) {
                var new_jobs_service_id = new_jobs_service_id_string.split(',');
                var new_jobs_rate = new_jobs_rate_string.split(',');
                var new_jobs_qty = new_jobs_qty_string.split(',');
                var new_jobs_cat = new_jobs_cat_string.split(',');
                var new_jobs_descp = new_jobs_descp_string.split(',');

                for (var x = 0; x < new_jobs_service_id.length; x++) {
                    createJobRecord(internal_id, new_jobs_service_id[x], new_jobs_rate[x], new_jobs_qty[x], new_jobs_descp[x], new_jobs_cat[x], request.getParameter('end_date'));
                }
            }

            if (!isNullorEmpty(new_service_type_string)) {
                var new_service_type = new_service_type_string.split(',');
                var new_service_name = new_service_name_string.split(',');
                var new_service_price = new_service_price_string.split(',');
                var new_service_customer = new_service_customer_string.split(',');
                var new_service_comm_reg = new_service_comm_reg_string.split(',');
                var new_service_qty = new_service_qty_string.split(',');
                var new_service_descp = new_service_descp_string.split(',');
                var new_service_cat = new_service_cat_string.split(',');
    
                for (var x = 0; x < new_service_type.length; x++) {
    
                    var new_service_id = createServiceRecord(new_service_type[x], new_service_name[x], new_service_price[x], internal_id, new_service_comm_reg[x]);
    
                    createJobRecord(internal_id, new_service_id, new_service_price[x], new_service_qty[x], new_service_descp[x], new_service_cat[x], request.getParameter('end_date'));
                }
            }
    
    
    
            log.debug({
                title: 'delete2',
                details: delete_job_id
            });

             /**
             * [if description] - Delete the job records if the value entered in the update qty is 0
             */
            if (!isNullorEmpty(delete_job_id)) {
                for (var i = 0; i < delete_job_id.length; i++) {
                    record.delete({
                        type: 'customrecord_job',
                        id: delete_job_id[i]
                    })
                }
            }

            /**
             * [if description] - Create / Update the extra services in the suitlet instead of the client script becasue the these extra services have just one service record from which the job is created and hence the fracnhisee will not be able to access the service record until and unless its done in the suitlet which is run as administrator.
             */
            if (!isNullorEmpty(extra_service_string) && !isNullorEmpty(extra_qty_string)) {
                for (var i = 0; i < extra_service.length; i++) {
                    var searched_jobs_extras = search.load({
                        id: 'customsearch_job_invoicing_jobs',
                        type: 'customrecord_job'
                    })

                    searched_jobs_extras.filters.push(search.createFilter({
                        name: 'custrecord_job_customer',
                        operator: search.Operator.IS,
                        values: internal_id
                    }));

                    searched_jobs_extras.filters.push(search.createFilter({
                        name: 'custrecord_job_service',
                        operator: search.Operator.IS,
                        values: extra_service[i]
                    }));

                    searched_jobs_extras.filters.push(search.createFilter({
                        name: 'custrecord_job_source',
                        operator: search.Operator.IS,
                        values: 5
                    }));

                    searched_jobs_extras.filters.push(search.createFilter({
                        name: 'custrecord_job_date_scheduled',
                        operator: search.Operator.ONORAFTER,
                        values: format.format({ value: context.request.parameters.start_date, type: format.Type.DATE })
                    }));

                    searched_jobs_extras.filters.push(search.createFilter({
                        name: 'custrecord_job_date_scheduled',
                        operator: search.Operator.ONORBEFORE,
                        values: context.request.parameters.end_date
                    }));
                   

                    var resultSet_extras = searched_jobs_extras.run();

                    var packageResult = resultSet_extrasResultSet.getRange({
                        start: 0,
                        end: 1
                    })

                    if (packageResult.length == 0) {

                        if (extra_qty[i] > 0) {
                            var job_new_record = record.create({
                                type: 'customrecord_job',
                                isDynamic: true,
                            });
                            
                            // var franchisee = recCustomer.getValue({ fieldId: 'partner' });

                            job_new_record.setValue({ fieldId: 'custrecord_job_customer', value: internal_id });
                            job_new_record.setValue({ fieldId: 'custrecord_job_franchisee', value: zee });
                            job_new_record.setValue({ fieldId: 'custrecord_job_service', value: extra_service[i] });
                            job_new_record.setValue({ fieldId: 'custrecord_job_extras_qty', value: extra_qty[i] });
                            job_new_record.setValue({ fieldId: 'custrecord_job_service_price', value: extra_rate[i] });
                            job_new_record.setValue({ fieldId: 'custrecord_job_status', value: 3 });
                            job_new_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                            job_new_record.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate() });
                            job_new_record.setValue({ fieldId: 'custrecord_job_source', value: 5 });
                            job_new_record.setValue({ fieldId: 'custrecord_job_date_scheduled', value: context.request.parameters.end_date });
                            job_new_record.setValue({ fieldId: 'custrecord_job_service_category', value: 2 });

                            job_new_record.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                        }
                    } else {
                        if (packageResult.length == 1) {
                            resultSet_extras.each(function(searchResult_extras) {
                                var job_record = record.load({
                                    type: 'customrecord_job',
                                    id: searchResult_extras.getValue('internalid'),
                                });

                                job_record.setValue({ fieldId: 'custrecord_job_extras_qty', value: extra_qty[i] });
                                job_record.setValue({ fieldId: 'custrecord_job_status', value: 3 });
                                job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                                job_record.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate() });
                                job_record.setValue({ fieldId: 'custrecord_job_source', value: 5 });
                                job_record.setValue({ fieldId: 'custrecord_job_date_scheduled', value: context.request.parameters.end_date });

                                job_record.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                });

                               
                                return true;
                            });

                        } else if (packageResult.length > 1) {
                            alert('More than One Service');
                            return false;
                        }
                    }
                }
            }
    


        }
    }

     /**
     * [serviceTypeLoop description] - To generate the service type dropwdown
     * @param  {[type]} searchResult Service Type search result
     * @param  {[type]} option       Dropdown option field
     * @return {[type]}              [description]
     */
    function serviceTypeLoop(searchResult, option) {
        

        var x = 0;
        searchResult.run().each( function(search_res) {
            
            if (search_res.getValue('internalid') != 22) {
                option.addSelectOption({​​​​​
                    value: search_res.getValue('internalid'),
                    text: search_res.getValue('name'),
                }​​​​​);
            }

            x++;
            return true;
        })
        
    }

 
    
    function createServiceRecord(service_type, service_name, price, customer_id, comm_reg) {

        var new_service_record = record.create({
            type: 'customrecord_service',
        });

        new_service_record.setValue({ fieldId: 'custrecord_service_customer', value: customer_id });
        new_service_record.setValue({ fieldId: 'custrecord_service', value: service_type });
        new_service_record.setValue({ fieldId: 'name', value: service_name });
        new_service_record.setValue({ fieldId: 'custrecord_service_franchisee', value: zee });

        new_service_record.setValue({ fieldId: 'custrecord_service_price', value: price });

            if (!isNullorEmpty(comm_reg)) {
            new_service_record.setValue({ fieldId: 'custrecord_service_comm_reg', value: comm_reg });
        }

        var service_id = new_service_record.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        })

        return service_id;
    }

    function createJobRecord(customer_id, service_id, rate, qty, description, category, end_date) {
        var job_new_record = record.create({
            type: 'customrecord_job',
        })

        job_new_record.setValue({ fieldId: 'custrecord_job_customer', value: customer_id });
        job_new_record.setValue({ fieldId: 'custrecord_job_franchisee', value: zee });
        job_new_record.setValue({ fieldId: 'custrecord_job_service', value: service_id });
        job_new_record.setValue({ fieldId: 'custrecord_job_service_price', value: rate });
        job_new_record.setValue({ fieldId: 'custrecord_job_extras_qty', value: qty });
        job_new_record.setValue({ fieldId: 'custrecord_job_status', value: 3 });
        job_new_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
        job_new_record.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate() });
        job_new_record.setValue({ fieldId: 'custrecord_job_source', value: 5 });
        job_new_record.setValue({ fieldId: 'custrecord_job_invoice_detail', value: description });
        job_new_record.setValue({ fieldId: 'custrecord_job_date_scheduled', value: end_date });
        if (category == '1') {
            job_new_record.setValue({ fieldId: 'custrecord_job_group_status', value: 'Completed' });
        }
        job_new_record.setValue({ fieldId: 'custrecord_job_service_category', value: category });

        job_new_record.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
    }

    function serviceTypeSearch(service_type_id, service_cat){
        var filters = new Array();
        if(!isNullorEmpty(service_type_id)){
            filters[filters.length] = search.createFilter({
                name: 'custrecord_service_type_ns_item',
                operator: search.Operator.IS,
                values: service_type_id,
            });
        }
        if(!isNullorEmpty(service_cat)){
            filters[filters.length] = search.createFilter({
                name: 'custrecord_service_type_category',
                operator: search.Operator.ANYOF,
                values: service_cat,
            });
        }
       
        
        var columns = new Array();
        columns[0] = search.createColumn({
            name: 'internalid',
        });
        columns[1] = search.createColumn({
            name: 'custrecord_service_type_ns_item_array',
        });
        columns[2] = search.createColumn({
            name: 'name',
        });
    
        var service_type_search = search.create({
            type: 'customrecord_service_type',
            filters: filters,
            columns: columns,
        });
    
        if(isNullorEmpty(service_type_search)){
             var filters = new Array();
            // filters[0] = new nlobjSearchFilter('custrecord_service_type_ns_item', null, 'is', service_type_id);
              service_type_id = service_type_id+',';
            filters[filters.length] = search.createFilter({
                name: 'custrecord_service_type_ns_item_array',
                operator: search.Operator.CONTAINS,
                values: service_type_id,
            });
           if(!isNullorEmpty(service_cat)){
            filters[filters.length] = search.createFilter({
                name: 'custrecord_service_type_category',
                operator: search.Operator.ANYOF,
                values: service_cat,
            });
        }
    
            var columns = new Array();
            columns[0] = search.createColumn({
                name: 'internalid',
            });
            columns[1] = search.createColumn({
                name: 'custrecord_service_type_ns_item_array',
            });
    
            var service_type_search2 = search.create({
                type: 'customrecord_service_type',
                filters: filters,
                columns: columns,
            });
    
           
            return service_type_search2;
        }
    
    
        return service_type_search;
    }
     function isNullorEmpty(strVal) {
         return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
     }
     
     return {
         onRequest: onRequest
     };
 
 });