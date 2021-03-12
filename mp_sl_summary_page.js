/**
 * 
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * 
 * Description: Invoicing Review Summary Page
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
    var ctx = runtime.getCurrentScript();
    var role = runtime.getCurrentUser().role;
    if (role == 1000) {
        //Franchisee
        zee = runtime.getCurrentUser();
    } else if (role == 3) { //Administrator
    zee = '6'; //test
    } else if (role == 1032) { // System Support
        zee = '425904'; //test-AR
    }
    var start_date;
    var end_date;
    var zee_name;

    function onRequest(context) {  
        
        if (context.request.method === 'GET') {
            var start_time = Date.now();

            var form = ui.createForm({
                title: 'Auto Invoicing Console: Summary Page'
            });

            
            // Load jQuery
            var inlinehtml2 = '<script src="https://code.jquery.com/jquery-1.12.4.min.js" integrity="sha384-nvAa0+6Qg9clwYCGGPpDQLVpLNn0fRaROjHqs13t4Ggj3Ez50XnGQqc/r8MhnRDZ" crossorigin="anonymous"></script>';
            // Load Tooltip
            inlinehtml2 += '<script src="https://unpkg.com/@popperjs/core@2"></script>';

            // Load Bootstrap
            inlinehtml2 += '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous">';
            inlinehtml2 += '<script src="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js" integrity="sha384-aJ21OjlMXNL5UyIl/XNwTMqvzeRMZH2w8c5cRVpzpU8Y5bApTppSuUkhZXN0VxHd" crossorigin="anonymous"></script>';
            // Load DataTables
            inlinehtml2 += '<link rel="stylesheet" type="text/css" href="//cdn.datatables.net/1.10.21/css/jquery.dataTables.min.css">';
            inlinehtml2 += '<script type="text/javascript" charset="utf8" src="//cdn.datatables.net/1.10.21/js/jquery.dataTables.min.js"></script>';

            // Load Bootstrap-Select
            inlinehtml2 += '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-select@1.13.14/dist/css/bootstrap-select.min.css">';
            inlinehtml2 += '<script src="https://cdn.jsdelivr.net/npm/bootstrap-select@1.13.14/dist/js/bootstrap-select.min.js"></script>';

            // Load Netsuite stylesheet and script
            inlinehtml2 += '<link rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/>';
            inlinehtml2 += '<script src="https://1048144.app.netsuite.com/core/media/media.nl?id=2060797&c=1048144&h=ef2cda20731d146b5e98&_xt=.js"></script>';
            inlinehtml2 += '<link type="text/css" rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css">';

            inlinehtml2 += '<div class="se-pre-con"></div><button type="button" class="btn btn-sm btn-info instruction_button" data-toggle="collapse" data-target="#demo">Click for Instructions</button><div id="demo" style="background-color: #cfeefc !important;border: 1px solid #417ed9;padding: 10px 10px 10px 20px;width:96%;position:absolute" class="collapse"><b><u>Important Instructions:</u></b><ul><li>Click headers to sort. Hold <b><i>"Shift"</i></b> and click another column to sort according to multiple columns.</li><li>Can search for specific customer by typing into the Search bar</li><li><input class="btn-xs btn-default" type="button" value="START REVIEW" disabled> - Click to <b>Start</b> the Invoice Review for the Customer</li><li><input class="btn-xs btn-default" type="button" value="CONTINUE REVIEW" disabled> - Click to <b>Continue</b> the Invoice Review Pro';
            inlinehtml2 += 'cess</li><li><input class="btn-xs btn-primary" type="button" value="FINALISE" disabled> - Click when all the Customer\'s Invoice has been reviewed and its ready for Invoicing</li><li><b>ACTIONS</b> reveals the stage of the review process for each customer: <ul><li><input class="btn-xs btn-danger" type="button" value="REVIEW" disabled> - New <b>activities</b> from Mailplus GO app are available for review.</li><li><input class="btn-xs btn-primary" type="button" value="EDIT" disabled> - All <b>activities</b> from Mailplus GO app are reviewed, up-to-date and can be edited.</li><li><input class="btn-xs btn-info" type="button" value="FINALISED" disabled> <small><b>(LOCKED)</b></small> - All activities from Mailplus GO app are finalised for invoicing</li></li><li><input class="btn-xs btn-success active" type="button" value="INVOICED" disable';
            inlinehtml2 += 'd> <small><b>(LOCKED)</b></small> - Invoice has been automatically created using activities from Mailplus GO app. </li><li><input class="btn-xs btn btn-default" type="button" value="CUSTOM INVOICE" disabled> <small><b>(LOCKED)</b></small> - Invoice has been generated without the use of activities from Mailplus GO app.</ul></li></ul></div>';
            inlinehtml2 += '<div class="col-xs-4 admin_section" style="width: 20%;left: 40%;position: absolute;"><label class="control-label">Invoicing Month <span class="glyphicon glyphicon-asterisk" style="font-size: 5px;top: -5px;color: red;"></span></label>';

            var result = finalise_date();



            if (result == true && isNullorEmpty(context.request.parameters.start_date)) {
                var date_string = start_end_date();
                start_date = date_string[0];
                end_date = date_string[1];
                
                
                form.addField({ id: 'start_date', type: 'text', label: 'start_date' }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                }).defaultValue = date_string[0];
                form.addField({ id: 'end_date', type: 'text', label: 'end_date' }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                }).defaultValue = date_string[1];
                var splitDate = date_string[0].split('/');
                if (splitDate[1].length == 1) {
                    splitDate[1] = '0' + splitDate[1]
                }
                var startDate = splitDate[2] + '-' + splitDate[1];
                inlinehtml2 += '<input type="month" class="form-control invoicing_month" value="' + startDate + '" required="required" />';
            } else if (!isNullorEmpty(context.request.parameters.start_date)) {
                start_date = context.request.parameters.start_date;
                end_date = context.request.parameters.end_date;
                form.addField({ id: 'start_date', type: 'text', label: 'start_date' }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                }).defaultValue = context.request.parameters.start_date;
                form.addField({ id: 'end_date', type: 'text', label: 'end_date' }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                }).defaultValue = context.request.parameters.end_date;
                var splitDate = context.request.parameters.start_date.split('/');
                if (splitDate[1].length == 1) {
                    splitDate[1] = '0' + splitDate[1]
                }
                var startDate = splitDate[2] + '-' + splitDate[1];
                inlinehtml2 += '<input type="month" class="form-control invoicing_month" value="' + startDate + '" required="required"/>';
            } else {
                var todayDate = getDate();
                var service_dates = service_start_end_date(todayDate);
                start_date = service_dates[0];
                end_date = service_dates[1];
                form.addField({ id: 'start_date', type: 'text', label: 'start_date' }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                }).defaultValue = service_dates[0];
                form.addField({ id: 'end_date', type: 'text', label: 'end_date' }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                }).defaultValue = service_dates[1];
                var splitDate = service_dates[0].split('/');
                if (splitDate[1].length == 1) {
                    splitDate[1] = '0' + splitDate[1]
                }
                var startDate = splitDate[2] + '-' + splitDate[1];
                inlinehtml2 += '<input type="month" class="form-control invoicing_month" value="' + startDate + '" required="required" />';
            }

            
            log.debug({ title: 'zee', details: zee });
            if (zee == 6 || zee == 425904) {
                inlinehtml2 += '<select class="form-control zee_dropdown" >';

                var searched_zee = search.load({ id: 'customsearch_job_inv_process_zee', type: search.Type.PARTNER });
                
                var resultSet_zee = searched_zee.run();

                var count_zee = 0;

                var zee_id;

                inlinehtml2 += '<option value=""></option>'

                resultSet_zee.each(function(searchResult_zee) {

                    zee_id = searchResult_zee.getValue('internalid');
                    zee_name = searchResult_zee.getValue('entityid');

                    if (context.request.parameters.zee == zee_id) {
                        inlinehtml2 += '<option value="' + zee_id + '" selected="selected">' + zee_name + '</option>';
                    } else {
                        inlinehtml2 += '<option value="' + zee_id + '">' + zee_name + '</option>';
                    }


                    return true;
                });

                inlinehtml2 += '</select>';
            }

            if (!isNullorEmpty(context.request.parameters.zee)) {
                zee = context.request.parameters.zee;
            }

            var zee_record = record.load({
                type: record.Type.PARTNER,
                id: zee,
            });

            var zee_text = zee_record.getValue({ fieldId: 'entitytitle' });
            var zeeName = zee_record.getValue({ fieldId: 'entityid' });
            // inlinehtml2 += '</div>';

            var inlineQty = '<script src="https://code.jquery.com/jquery-1.12.4.min.js" integrity="sha384-nvAa0+6Qg9clwYCGGPpDQLVpLNn0fRaROjHqs13t4Ggj3Ez50XnGQqc/r8MhnRDZ" crossorigin="anonymous"></script>';
            // Load Tooltip
            inlineQty += '<script src="https://unpkg.com/@popperjs/core@2"></script>';

            // Load Bootstrap
            inlineQty += '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous">';
            inlineQty += '<script src="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js" integrity="sha384-aJ21OjlMXNL5UyIl/XNwTMqvzeRMZH2w8c5cRVpzpU8Y5bApTppSuUkhZXN0VxHd" crossorigin="anonymous"></script>';
            // Load DataTables
            inlineQty += '<link rel="stylesheet" type="text/css" href="//cdn.datatables.net/1.10.21/css/jquery.dataTables.min.css">';
            inlineQty += '<script type="text/javascript" charset="utf8" src="//cdn.datatables.net/1.10.21/js/jquery.dataTables.min.js"></script>';

            // Load Bootstrap-Select
            inlineQty += '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-select@1.13.14/dist/css/bootstrap-select.min.css">';
            inlineQty += '<script src="https://cdn.jsdelivr.net/npm/bootstrap-select@1.13.14/dist/js/bootstrap-select.min.js"></script>';

            // Load Netsuite stylesheet and script
            inlineQty += '<link rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/>';
            inlineQty += '<script src="https://1048144.app.netsuite.com/core/media/media.nl?id=2060797&c=1048144&h=ef2cda20731d146b5e98&_xt=.js"></script>';
            inlineQty += '<link type="text/css" rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css">';


            inlineQty += '<div><style>table#stockcount {font-size:12px; font-weight:bold; text-align:center; border-color: #24385b;} </style><table border="0" cellpadding="10" id="stockcount" cellspacing="0" class="table table-responsive table-striped"><thead style="color: white;background-color: #607799;"><tr><td style="text-align:left;"><b>ID</b></td><td style="text-align:left;" class="col-sm-3"><b>CUSTOMER NAME</b></td><td><b>ACTION</b></td><td style="text-align:right;" class="col-sm-2"><b>EXPECTED INVOICE</b></td><td class="col-sm-2" style="text-align:right;"><b>EXPECTED DISTRIBUTION</b></td><td><b>LINK TO INVOICE</b></td></tr></thead><tbody>';

            // var searchedSummary = search.load({ id: 'customrecord_job', type: 'customsearch_job_invoicing_summary' });
            //var searchedSummary = search.load({ id: 'customrecord_job', type: 'customsearch_job_inv_review_exp_amt' });

            var zeeName_firstletter = zeeName.substring(0, 1);
            var zeeName_test = zeeName.substring(0, 4);
            // log.debug({ title: 'zeeName_firstletter', details: zeeName_firstletter });
            // log.debug({ title: 'zeeName_test', details: zeeName_test });


            if (zeeName_test == 'TEST') {
                var searchedSummary = search.load({ type: 'customrecord_job', id: 'customsearch_job_inv_review_exp_amt_test' });
            } else if (zeeName_firstletter == 'A' || zeeName_firstletter == 'B' || zeeName_firstletter == 'C' || zeeName_firstletter == 'D' || zeeName_firstletter == 'E' || zeeName_firstletter == 'F') {
                var searchedSummary = search.load({ type: 'customrecord_job', id: 'customsearch_job_inv_review_exp_amt_a_f' });
            } else if (zeeName_firstletter == 'G' || zeeName_firstletter == 'H' || zeeName_firstletter == 'I' || zeeName_firstletter == 'J' || zeeName_firstletter == 'K' || zeeName_firstletter == 'L' || zeeName_firstletter == 'M') {
                var searchedSummary = search.load({ type: 'customrecord_job', id: 'customsearch_job_inv_review_exp_amt_g_m' });
            } else if (zeeName_firstletter == 'N' || zeeName_firstletter == 'O' || zeeName_firstletter == 'P' || zeeName_firstletter == 'Q' || zeeName_firstletter == 'R') {
                var searchedSummary = search.load({ type: 'customrecord_job', id: 'customsearch_job_inv_review_exp_amt_n_r' });
            } else if (zeeName_firstletter == 'S' || zeeName_firstletter == 'T' || zeeName_firstletter == 'U' || zeeName_firstletter == 'V' || zeeName_firstletter == 'W' || zeeName_firstletter == 'X' || zeeName_firstletter == 'Y' || zeeName_firstletter == 'Z') {
                var searchedSummary = search.load({ type: 'customrecord_job', id: 'customsearch_job_inv_review_exp_amt_s_z' });
            }

            //var zee_record = nlapiLoadRecord('partner', zee);

            //var zee_text = zee_record.getValue({ fieldId: 'entitytitle' });

            var strFormula = "COALESCE({custrecord_job_service.custrecord_service_franchisee},{custrecord_job_group.custrecord_jobgroup_franchisee},{custrecord_job_franchisee},'')";

            if (!isNullorEmpty(start_date) && !isNullorEmpty(end_date)) {

                searchedSummary.filters.push(search.createFilter({ name: 'custrecord_job_date_scheduled', join: null, operator: search.Operator.ONORAFTER, values: start_date }));
                searchedSummary.filters.push(search.createFilter({ name: 'custrecord_job_date_scheduled', join: null, operator: search.Operator.ONORBEFORE, values: end_date }));
            }
            //searchedSummary.filters.push(search.createFilter({ name: 'formulatext', join: null, operator: search.Operator 'is', values: zee_text })).setFormula(strFormula);
            searchedSummary.filters.push(search.createFilter({ name: "partner", join: "CUSTRECORD_JOB_CUSTOMER", operator: search.Operator.ANYOF, values: zee }));

            var resultSet = searchedSummary.run();

            form.addField({ 
                id: 'zee', 
                type: 'text', 
                label: 'zee' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = zee;

            var startReview = true;
            var startFinalize = false;

            var countCustomers = 0;
            var countTotalJobsInvoiceable = 0;

            var old_customer_id;
            var old_service_id;
            var old_service_rate;
            var old_service_qty;
            var old_extra_qty;
            var old_service_type;
            var old_customer_name;
            var old_ID;
            var old_service_text;
            var old_package_id;
            var old_package_single_line;
            var old_package_period;
            var old_package_fix_rate;
            var old_invoice_id;
            var old_invoice_text;

            var old_sc_ID;
            var old_sc_entity_id;
            var old_sc_name;
            var old_sc_company_name;

            var old_date_reviewed;

            var global_gst = 0.10;


            var total_per_customer = 0.0;
            var total_comm_per_customer = 0.0;
            var old_invoice_total = 0.0;
            var total_gst = 0.0;

            var reviewed = false;
            var review = false;
            var edit = null;
            var edit_count = 0;
            var reviewed_count = 0;
            var invoiced = false;

            var single_line_discount = false;

            var total_monthly_invoice = 0.0;
            var total_monthly_comm = 0.0

            var old_invoiceable;
            var old_jobGroupStatus;

            var service_count = 0;
            var service_unique_count = 0;

            var admin_fees_result = false;

            var old_admin_fees;
            var old_invoice_custom;
            var old_customer_partner;

            var zee_comm_array = [];

            var invoiced_count = 0;

            /**
             * Goes through the list of jobs for the selected month. Search: Job - Invoicing Review - Summary.
             * @function resultSet
             * @param  {Array} searchResult    Each result from the search
             * @return {Boolean}               true
             */
            resultSet.each(function(searchResult) {
                var customerInternalID = searchResult.getValue({ name: 'internalid', join: 'CUSTRECORD_JOB_CUSTOMER', summary: search.Summary.GROUP });
                var specialCustomerInternalID = searchResult.getValue({ name: "custrecord_job_special_customer", join: null, summary: search.Summary.GROUP });
                var specialCustomerName = searchResult.getText({ name: "custrecord_job_special_customer", join: null, summary: search.Summary.GROUP });
                var partner = searchResult.getValue({ name: 'partner', join: 'CUSTRECORD_JOB_CUSTOMER', summary: search.Summary.GROUP });
                var ID = searchResult.getValue({ name: 'entityid', join: 'CUSTRECORD_JOB_CUSTOMER', summary: search.Summary.GROUP });
                var scID = searchResult.getValue({ name: "entityid", join: "CUSTRECORD_JOB_SPECIAL_CUSTOMER", summary: search.Summary.GROUP });
                var companyName = searchResult.getValue({ name: 'companyname', join: 'CUSTRECORD_JOB_CUSTOMER', summary: search.Summary.GROUP });
                var specialCompanyName = searchResult.getValue({ name: 'companyname', join: 'CUSTRECORD_JOB_SPECIAL_CUSTOMER', summary: search.Summary.GROUP });
                var customerName = searchResult.getText({ name: 'custrecord_job_customer', join: null, summary: search.Summary.GROUP });
                var dateReviewed = searchResult.getValue({ name: 'custrecord_job_date_reviewed', join: null, summary: search.Summary.GROUP });
                var invoiceable = searchResult.getText({ name: 'custrecord_job_invoiceable', join: null, summary: search.Summary.GROUP });
                var jobGroupStatus = searchResult.getValue({ name: 'custrecord_jobgroup_status', join: 'CUSTRECORD_JOB_GROUP', summary: search.Summary.GROUP });
                var inv_if_incomplete = searchResult.getValue({ name: "custrecord_service_package_inv_incomplet", join: "CUSTRECORD_JOB_SERVICE_PACKAGE", summary: search.Summary.GROUP });
                var dateInvFinalised = searchResult.getValue({ name: 'custrecord_job_date_inv_finalised', join: null, summary: search.Summary.GROUP });
                var dateInvoiced = searchResult.getValue({ name: 'custrecord_job_date_invoiced', join: null, summary: search.Summary.GROUP });
                //No. of Jobs that does not have Date Reviewed
                var countJobsNoDateReviewed = searchResult.getValue({ name: 'formulanumeric', join: null, summary: search.Summary.SUM });
                //Total No. of Jobs
                var countJobs = searchResult.getValue({ name: 'internalid', join: null, summary: search.Summary.COUNT });

                var service_id = searchResult.getValue({ name: 'custrecord_job_service', join: null, summary: search.Summary.GROUP });
                var service_text = searchResult.getText({ name: 'custrecord_job_service', join: null, summary: search.Summary.GROUP });
                var service_category = searchResult.getValue({ name: "custrecord_job_service_category", join: null, summary: search.Summary.GROUP });
                var service_type = searchResult.getValue({ name: "custrecord_service", join: "CUSTRECORD_JOB_SERVICE", summary: search.Summary.GROUP });
                if (isNullorEmpty(searchResult.getValue({ name: 'formulanumeric', join: null, summary: search.Summary.SUM }))) {
                    var service_qty = 0;
                } else {
                    var service_qty = parseFloat(searchResult.getValue({ name: 'formulanumeric', join: null, summary: search.Summary.SUM }));
                }
                if (isNullorEmpty(searchResult.getValue({ name: 'custrecord_job_service_price', join: null, summary: search.Summary.GROUP }))) {
                    var service_rate = 0.0;
                    var body = 'Customer Name: ' + companyName + '/ Customer ID: ' + customerInternalID + ' | Service Name: ' + service_text + ' / Service ID: ' + service_id + ' has Null Service Price.';

                    email.send({
                        author: 112209,
                        body: body,
                        recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                        subject: 'AIC Summary Page - Customer: ' + companyName + ' with Null Service Price',
                    });

                } else {
                    var service_rate = parseFloat(searchResult.getValue({ name: 'custrecord_job_service_price', join: null, summary: search.Summary.GROUP }));
                }

                if (isNullorEmpty(searchResult.getValue({ name: 'custrecord_job_extras_qty', join: null, summary: search.Summary.SUM }))) {
                    var extra_qty = 0;
                } else {
                    var extra_qty = parseFloat(searchResult.getValue({ name: 'custrecord_job_extras_qty', join: null, summary: search.Summary.SUM }));
                }

                var date_inv_finalised = searchResult.getValue({ name: 'custrecord_job_date_inv_finalised', join: null, summary: search.Summary.GROUP });
                var date_invoiced = searchResult.getValue({ name: 'custrecord_job_date_invoiced', join: null, summary: search.Summary.GROUP });
                var date_reviewed = searchResult.getValue({ name: "formuladate", join: null, summary: search.Summary.GROUP });

                var package_id = searchResult.getValue({ name: 'custrecord_job_service_package', join: null, summary: search.Summary.GROUP });

                var package_single_line = searchResult.getValue({ name: 'custrecord_job_invoice_single_line_item', join: null, summary: search.Summary.GROUP });
                var package_period = searchResult.getValue({ name: 'custrecord_service_package_disc_period', join: 'CUSTRECORD_JOB_SERVICE_PACKAGE', summary: search.Summary.GROUP });
                if (isNullorEmpty(searchResult.getValue({ name: 'custrecord_service_package_fix_mth_rate', join: 'CUSTRECORD_JOB_SERVICE_PACKAGE', summary: search.Summary.GROUP }))) {
                    var package_fix_rate = 0.0
                } else {
                    var package_fix_rate = parseFloat(searchResult.getValue({ name: 'custrecord_service_package_fix_mth_rate', join: 'CUSTRECORD_JOB_SERVICE_PACKAGE', summary: search.Summary.GROUP }));
                }

                var invoice_id = searchResult.getValue({ name: "internalid", join: "CUSTRECORD_JOB_INVOICE", summary: search.Summary.GROUP });
                var invoice_text = searchResult.getValue({ name: "tranid", join: "CUSTRECORD_JOB_INVOICE", summary: search.Summary.GROUP });
                if (isNullorEmpty(searchResult.getValue({ name: "amount", join: "CUSTRECORD_JOB_INVOICE", summary: search.Summary.GROUP }))) {
                    var invoice_total = 0.0;
                } else {
                    var invoice_total = parseFloat(searchResult.getValue({ name: "amount", join: "CUSTRECORD_JOB_INVOICE", summary: search.Summary.GROUP }));
                }

                var gst = searchResult.getValue({ name: "custrecord_service_gst", join: "CUSTRECORD_JOB_SERVICE", summary: search.Summary.GROUP });
                if (isNullorEmpty(searchResult.getValue({ name: "custentity_admin_fees", join: "CUSTRECORD_JOB_CUSTOMER", summary: search.Summary.GROUP }))) {
                    var admin_fees = 0.0;
                } else {
                    var admin_fees = parseFloat(searchResult.getValue({ name: "custentity_admin_fees", join: "CUSTRECORD_JOB_CUSTOMER", summary: search.Summary.GROUP }));
                }
                var invoice_custom = searchResult.getValue({ name: "custrecord_job_invoice_custom", join: null, summary: search.Summary.GROUP });
                var customer_partner = searchResult.getValue({ name: "partner", join: "CUSTRECORD_JOB_CUSTOMER", summary: search.Summary.GROUP });

                if (isNullorEmpty(invoice_custom)) {
                    invoice_custom = '';
                }

                var zee_comm = parseFloat(searchResult.getValue({ name: 'formulapercent', join: null, summary: search.Summary.GROUP }));

                if (companyName == 'B & R Enclosures Pty Ltd - Heathwood') {
                    log.debug({ title: 'service_id', details: service_id }); //569
                    log.debug({ title: 'service_text', details: service_text }); //569
                    log.debug({ title: 'package_id', details: package_id }); //569
                    log.debug({ title: 'package_single_line', details: package_single_line }); //1
                    log.debug({ title: 'package_period', details: package_period }); //1
                    log.debug({ title: 'package_fix_rate', details: package_fix_rate }); //9
                    log.debug({ title: 'service_type', details: service_type }); //9
                }

                zee_comm_array[zee_comm_array.length] = zee_comm;
                if (countCustomers == 0) {

                    if (isNullorEmpty(package_id)) {
                        if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (isNullorEmpty(invoiceable) && service_category != '1')) {
                            // var service_type = nlapiLookupField('customrecord_service', service_id, 'custrecord_service');
                            if (service_type == 22) {
                                admin_fees_result = true;
                            }
                            var total_per_line = (service_rate * (service_qty + extra_qty))
                            if (gst != 'No') {
                                total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                            } else {
                                total_per_customer = (total_per_customer + total_per_line);
                                total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                            }
                        }
                    } else {
                        if (package_single_line == '1') {
                            // var service_type = nlapiLookupField('customrecord_service', service_id, 'custrecord_service');
                            if (service_type == 17) {
                                single_line_discount = true;
                                var total_per_line = (service_rate * (service_qty + extra_qty))
                                if (gst != 'No') {
                                    total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                    total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                } else {
                                    total_per_customer = (total_per_customer + total_per_line);
                                    total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                }
                            } else {
                                service_unique_count++;
                                if (package_period != 3) {
                                    if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (inv_if_incomplete == '1')) {
                                        service_count += (service_qty + extra_qty);
                                    }
                                } else {
                                    service_count = 1;
                                }
                            }
                        } else {
                            if (service_type == 17) {
                                single_line_discount = true;
                            }
                            if (single_line_discount == true) {
                                if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (isNullorEmpty(invoiceable) && service_category != '1')) {
                                    var total_per_line = (service_rate * (service_qty + extra_qty));
                                    if (gst != 'No') {
                                        total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                        total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                    } else {
                                        total_per_customer = (total_per_customer + total_per_line);
                                        total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                    }
                                }
                            } else {
                                service_unique_count++;
                                if (package_period != 3) {
                                    if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (inv_if_incomplete == '1')) {
                                        service_count += (service_qty + extra_qty);
                                    }
                                } else {
                                    service_count = 1;
                                }
                            }
                        }
                    }
                } else {

                    if (old_customer_id != customerInternalID) {

                        var customer_locked = '';
                        var lock_class = '';


                        if (single_line_discount == false) {
                            if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                                log.audit({ title: 'service_count', details: service_count });
                                log.audit({ title: 'service_unique_count', details: service_unique_count });
                            }
                            if (service_count > 1) {
                                service_count = service_count / service_unique_count;
                            }
                            if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                                log.audit({ title: 'service_count', details: service_count });
                                log.audit({ title: 'total_per_customer', details: total_per_customer });
                                log.audit({ title: 'old_package_fix_rate', details: old_package_fix_rate });
                                log.audit({ title: 'zee_comm', details: zee_comm });
                            }
                            total_per_customer = total_per_customer + ((old_package_fix_rate * service_count) * 1.1);
                            total_comm_per_customer = total_comm_per_customer + (((zee_comm * ((old_package_fix_rate * service_count))) / 100) * 1.1);
                        }

                        var unique_zee_comm_array = [];
                        unique_zee_comm_array = zee_comm_array.filter(function(elem, index, self) {
                            return index == self.indexOf(elem);
                        });

                        var min_zee_comm = Math.min(unique_zee_comm_array);

                        if (!isNullorEmpty(old_admin_fess) && admin_fees_result == false && isNullorEmpty(old_date_reviewed)) {
                            total_per_customer = total_per_customer + (old_admin_fess * 1.1);
                            total_comm_per_customer = total_comm_per_customer + (((min_zee_comm * (old_admin_fess)) / 100) * 1.1);
                        }

                        if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                            log.debug({ title: 'total_per_customer for details: customer: ' + old_customer_name, details: total_per_customer });

                            // if(old_customer_id == 518069){
                            log.audit({ title: 'invoiced', details: invoiced });
                            log.audit({ title: 'old_invoice_custom', details: old_invoice_custom });
                            log.audit({ title: 'old_invoice_total', details: old_invoice_total });
                            log.audit({ title: 'total_per_customer', details: total_per_customer });
                        }

                        if (invoiced == true) {
                            if (isNullorEmpty(old_sc_ID)) {
                                inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align:left;">' + old_customer_name + '</p></td>';

                            } else {
                                inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align:left;">' + old_sc_company_name + '</p></td>';
                            }


                            if (old_invoice_custom == 2 || isNullorEmpty(old_invoice_custom)) {
                                inlineQty += '<td><button type="button" id="invoice_customer" onclick="onclickContinueReview(' + old_customer_id + ',\'yes\', ' + old_sc_ID + ')" class="form-control btn btn-success active invoice_customer ">INVOICED  <span class="glyphicon glyphicon-lock"></span></button></td>';
                            } else {
                                inlineQty += '<td><button type="button" id="invoice_customer"  onclick="onclickContinueReview(' + old_customer_id + ',\'yes\', ' + old_sc_ID + ')" class="form-control btn btn-default invoice_customer active">CUSTOM INVOICE  <span class="glyphicon glyphicon-lock"></span></button></td>';
                            }
                            if (roundTwoDec(total_per_customer) == roundTwoDec(old_invoice_total)) {
                                inlineQty += '<td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td>';
                                if (isNullorEmpty(old_invoice_id)) {
                                    inlineQty += '<td>NO INVOICE</td></tr>';
                                } else {
                                    inlineQty += '<td><a href="' + baseURL + '/app/accounting/transactions/custinvc.nl?id=' + old_invoice_id + '" target="_blank">' + old_invoice_text + '</a></td></tr>';
                                }

                            } else {
                                inlineQty += '<td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (old_invoice_total).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td>';
                                if (isNullorEmpty(old_invoice_id)) {
                                    inlineQty += '<td>NO INVOICE</td></tr>';
                                } else {
                                    inlineQty += '<td><a href="' + baseURL + '/app/accounting/transactions/custinvc.nl?id=' + old_invoice_id + '" target="_blank">' + old_invoice_text + '</a></td></tr>';
                                }
                            }
                        } else if (reviewed == true) {
                            if (isNullorEmpty(old_sc_ID)) {
                                inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align:left;">' + old_customer_name + '</p></td><td><input type="button" id="invoice_customer" value="FINALISED" onclick="onclickContinueReview(' + old_customer_id + ',\'yes\', ' + old_sc_ID + ')" class="form-control btn btn-info invoice_customer"> </td>';

                            } else {
                                inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align:left;">' + old_sc_company_name + '</p></td><td><input type="button" id="invoice_customer" value="FINALISED" onclick="onclickContinueReview(' + old_customer_id + ',\'yes\',' + old_sc_ID + ')" class="form-control btn btn-info invoice_customer"> </td>';
                            }


                            inlineQty += '<td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td><td>' + old_invoice_id + '</td></tr>';


                        } else if (edit == true) {
                            if (isNullorEmpty(old_sc_ID)) {
                                inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align: left;">' + old_customer_name + '</p></td>';
                            } else {
                                inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align: left;">' + old_sc_company_name + '</p></td>';
                            }


                            inlineQty += '<td><button type="button" id="invoice_customer" value="EDIT" onclick="onclickContinueReview(' + old_customer_id + ', \'' + customer_locked + '\', ' + old_sc_ID + ')" class="form-control btn btn-primary invoice_customer">EDIT <span class="' + lock_class + '"></span></button></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td><td>' + old_invoice_id + '</td></tr>';
                        } else {
                            if (isNullorEmpty(old_sc_ID)) {
                                inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align: left;">' + old_customer_name + '</p></td>';
                            } else {
                                inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align: left;">' + old_sc_company_name + '</p></td>';
                            }

                            inlineQty += '<td><button type="button" id="invoice_customer" value="REVIEW" onclick="onclickContinueReview(' + old_customer_id + ', \'' + customer_locked + '\', ' + old_sc_ID + ')" class="form-control btn btn-danger invoice_customer">REVIEW <span class="' + lock_class + '"></span></button> </td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td><td>' + old_invoice_id + '</td></tr>';
                        }

                        total_monthly_invoice += total_per_customer;
                        total_monthly_comm += total_comm_per_customer;

                        total_per_customer = 0.0;
                        total_comm_per_customer = 0.0;
                        reviewed = false;
                        edit = null;
                        invoiced = false;
                        single_line_discount = false;
                        service_count = 0;
                        service_unique_count = 0;
                        admin_fees_result = false;

                        zee_comm_array = [];

                        if (isNullorEmpty(package_id)) {
                            if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (isNullorEmpty(invoiceable) && service_category != '1')) {
                                // var service_type = nlapiLookupField('customrecord_service', service_id, 'custrecord_service');
                                if (service_type == 22) {
                                    admin_fees_result = true;
                                }
                                var total_per_line = (service_rate * (service_qty + extra_qty))
                                if (gst != 'No') {
                                    total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                    total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                } else {
                                    total_per_customer = (total_per_customer + total_per_line);
                                    total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                }
                            }
                        } else {
                            if (package_single_line == '1') {
                                // var service_type = nlapiLookupField('customrecord_service', service_id, 'custrecord_service');
                                if (service_type == 17) {
                                    single_line_discount = true;
                                    var total_per_line = (service_rate * (service_qty + extra_qty))
                                    if (gst != 'No') {
                                        total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                        total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                    } else {
                                        total_per_customer = (total_per_customer + total_per_line);
                                        total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                    }
                                } else {
                                    service_unique_count++;
                                    if (package_period != 3) {
                                        if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (inv_if_incomplete == '1')) {
                                            service_count += (service_qty + extra_qty);
                                        }
                                    } else {
                                        service_count = 1;
                                    }
                                }
                            } else {
                                if (service_type == 17) {
                                    single_line_discount = true;
                                }
                                if (single_line_discount == true) {
                                    if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (isNullorEmpty(invoiceable) && service_category != '1')) {
                                        var total_per_line = (service_rate * (service_qty + extra_qty));
                                        if (gst != 'No') {
                                            total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                            total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                        } else {
                                            total_per_customer = (total_per_customer + total_per_line);
                                            total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                        }
                                    }
                                } else {
                                    service_unique_count++;
                                    if (package_period != 3) {
                                        if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (inv_if_incomplete == '1')) {
                                            service_count += (service_qty + extra_qty);
                                        }
                                    } else {
                                        service_count = 1;
                                    }
                                }
                            }
                        }
                    } else {

                        if (old_sc_ID != specialCustomerInternalID) {

                            if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                                log.debug({ title: 'Inside Special Customer' });
                            }

                            var customer_locked = '';
                            var lock_class = '';


                            if (single_line_discount == false) {
                                if (service_count > 1) {
                                    service_count = service_count / service_unique_count;
                                }
                                total_per_customer = total_per_customer + ((old_package_fix_rate * service_count) * 1.1);
                                total_comm_per_customer = total_comm_per_customer + (((zee_comm * ((old_package_fix_rate * service_count))) / 100) * 1.1);
                            }

                            var unique_zee_comm_array = [];
                            unique_zee_comm_array = zee_comm_array.filter(function(elem, index, self) {
                                return index == self.indexOf(elem);
                            });

                            var min_zee_comm = Math.min(unique_zee_comm_array);

                            if (!isNullorEmpty(old_admin_fess) && admin_fees_result == false && isNullorEmpty(old_date_reviewed)) {
                                total_per_customer = total_per_customer + (old_admin_fess * 1.1);
                                total_comm_per_customer = total_comm_per_customer + (((min_zee_comm * (old_admin_fess)) / 100) * 1.1);
                            }

                            // log.debug({ title: 'SC - details: total_per_customer } for customer: ' + old_sc_name, total_per_customer);

                            if (invoiced == true) {
                                if (isNullorEmpty(old_sc_ID)) {
                                    inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align:left;">' + old_customer_name + '</p></td>';

                                } else {
                                    inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align:left;">' + old_sc_company_name + '</p></td>';
                                }


                                if (old_invoice_custom == 2 || isNullorEmpty(old_invoice_custom)) {
                                    inlineQty += '<td><button type="button" id="invoice_customer" onclick="onclickContinueReview(' + old_customer_id + ',\'yes\')" class="form-control btn btn-success active invoice_customer ">INVOICED  <span class="glyphicon glyphicon-lock"></span></button></td>';
                                } else {
                                    inlineQty += '<td><button type="button" id="invoice_customer"  onclick="onclickContinueReview(' + old_customer_id + ',\'yes\')" class="form-control btn btn-default invoice_customer active">CUSTOM INVOICE  <span class="glyphicon glyphicon-lock"></span></button></td>';
                                }
                                if (roundTwoDec(total_per_customer) == roundTwoDec(old_invoice_total)) {
                                    inlineQty += '<td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td>';
                                    if (isNullorEmpty(old_invoice_id)) {
                                        inlineQty += '<td>NO INVOICE</td></tr>';
                                    } else {
                                        inlineQty += '<td><a href="' + baseURL + '/app/accounting/transactions/custinvc.nl?id=' + old_invoice_id + '" target="_blank">' + old_invoice_text + '</a></td></tr>';
                                    }

                                } else {
                                    inlineQty += '<td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (old_invoice_total).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td>';
                                    if (isNullorEmpty(old_invoice_id)) {
                                        inlineQty += '<td>NO INVOICE</td></tr>';
                                    } else {
                                        inlineQty += '<td><a href="' + baseURL + '/app/accounting/transactions/custinvc.nl?id=' + old_invoice_id + '" target="_blank">' + old_invoice_text + '</a></td></tr>';
                                    }
                                }
                            } else if (reviewed == true) {
                                if (isNullorEmpty(old_sc_ID)) {
                                    inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align:left;">' + old_customer_name + '</p></td><td><input type="button" id="invoice_customer" value="FINALISED" onclick="onclickContinueReview(' + old_customer_id + ',\'yes\', ' + old_sc_ID + ')" class="form-control btn btn-info invoice_customer"> </td>';

                                } else {
                                    inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align:left;">' + old_sc_company_name + '</p></td><td><input type="button" id="invoice_customer" value="FINALISED" onclick="onclickContinueReview(' + old_customer_id + ',\'yes\', ' + old_sc_ID + ')" class="form-control btn btn-info invoice_customer"> </td>';
                                }


                                inlineQty += '<td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td><td>' + old_invoice_id + '</td></tr>';


                            } else if (edit == true) {
                                if (isNullorEmpty(old_sc_ID)) {
                                    inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align: left;">' + old_customer_name + '</p></td>';
                                } else {
                                    inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align: left;">' + old_sc_company_name + '</p></td>';
                                }


                                inlineQty += '<td><button type="button" id="invoice_customer" value="EDIT" onclick="onclickContinueReview(' + old_customer_id + ', \'' + customer_locked + '\', ' + old_sc_ID + ')" class="form-control btn btn-primary invoice_customer">EDIT <span class="' + lock_class + '"></span></button></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td><td>' + old_invoice_id + '</td></tr>';
                            } else {
                                if (isNullorEmpty(old_sc_ID)) {
                                    inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align: left;">' + old_customer_name + '</p></td>';
                                } else {
                                    inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align: left;">' + old_sc_company_name + '</p></td>';
                                }

                                inlineQty += '<td><button type="button" id="invoice_customer" value="REVIEW" onclick="onclickContinueReview(' + old_customer_id + ', \'' + customer_locked + '\', ' + old_sc_ID + ')" class="form-control btn btn-danger invoice_customer">REVIEW <span class="' + lock_class + '"></span></button> </td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td><td>' + old_invoice_id + '</td></tr>';
                            }

                            total_monthly_invoice += total_per_customer;
                            total_monthly_comm += total_comm_per_customer;

                            total_per_customer = 0.0;
                            total_comm_per_customer = 0.0;
                            reviewed = false;
                            edit = null;
                            invoiced = false;
                            single_line_discount = false;
                            service_count = 0;
                            service_unique_count = 0;
                            admin_fees_result = false;

                            zee_comm_array = [];

                            if (isNullorEmpty(package_id)) {
                                if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (isNullorEmpty(invoiceable) && service_category != '1')) {
                                    // var service_type = nlapiLookupField('customrecord_service', service_id, 'custrecord_service');
                                    if (service_type == 22) {
                                        admin_fees_result = true;
                                    }
                                    var total_per_line = (service_rate * (service_qty + extra_qty))
                                    if (gst != 'No') {
                                        total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                        total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                    } else {
                                        total_per_customer = (total_per_customer + total_per_line);
                                        total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                    }
                                }
                            } else {
                                if (package_single_line == '1') {
                                    // var service_type = nlapiLookupField('customrecord_service', service_id, 'custrecord_service');
                                    if (service_type == 17) {
                                        single_line_discount = true;
                                        var total_per_line = (service_rate * (service_qty + extra_qty))
                                        if (gst != 'No') {
                                            total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                            total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                        } else {
                                            total_per_customer = (total_per_customer + total_per_line);
                                            total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                        }
                                    } else {
                                        if (package_period != 3) {
                                            if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (inv_if_incomplete == '1')) {
                                                service_count += (service_qty + extra_qty);
                                            }
                                        } else {
                                            service_count = 1;
                                        }
                                    }
                                } else {
                                    if (service_type == 17) {
                                        single_line_discount = true;
                                    }
                                    if (single_line_discount == true) {
                                        if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (isNullorEmpty(invoiceable) && service_category != '1')) {
                                            var total_per_line = (service_rate * (service_qty + extra_qty));
                                            if (gst != 'No') {
                                                total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                                total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                            } else {
                                                total_per_customer = (total_per_customer + total_per_line);
                                                total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                            }
                                        }
                                    } else {
                                        if (package_period != 3) {
                                            if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (inv_if_incomplete == '1')) {
                                                service_count += (service_qty + extra_qty);
                                            }
                                        } else {
                                            service_count = 1;
                                        }
                                    }
                                }
                            }
                        } else if (old_service_id != service_id) {

                            if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                                log.debug({ title: 'Inside New Services', details: old_service_text });
                            }

                            if (old_package_id != package_id) {
                                if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                                    log.audit({ title: 'End of Packages'});
                                    log.audit({ title: 'service_count', details: service_count });
                                    log.audit({ title: 'service_unique_count', details: service_unique_count });
                                    log.audit({ title: 'total_per_customer', details: total_per_customer });
                                    log.audit({ title: 'total_comm_per_customer', details: total_comm_per_customer });
                                }
                                if (single_line_discount == false) {
                                    if (service_count > 1) {
                                        service_count = service_count / service_unique_count;
                                    }
                                    total_per_customer = total_per_customer + ((old_package_fix_rate * service_count) * 1.1);
                                    total_comm_per_customer = total_comm_per_customer + (((zee_comm * ((old_package_fix_rate * service_count))) / 100) * 1.1);
                                }
                                single_line_discount = false;
                                service_count = 0;
                                service_unique_count = 0;
                                if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                                    log.audit({ title: 'End of Packages' });
                                    log.audit({ title: 'total_per_customer', details: total_per_customer });
                                    log.audit({ title: 'total_comm_per_customer', details: total_comm_per_customer });
                                }
                            }

                            service_unique_count++;

                            if (isNullorEmpty(package_id)) {
                                if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (isNullorEmpty(invoiceable) && service_category != '1')) {

                                    if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                                        log.audit({ title: 'Inside Non Packages Invoiceable Yes or Status Completed or Extras' });
                                        log.audit({ title: 'total_comm_per_customer', details: total_comm_per_customer });
                                        log.audit({ title: 'total_per_customer', details: total_per_customer });
                                        log.audit({ title: 'invoiceable', details: invoiceable });
                                        log.audit({ title: 'jobGroupStatus', details: jobGroupStatus });
                                        log.audit({ title: 'service_category', details: service_category });
                                    }
                                    // var service_type = nlapiLookupField('customrecord_service', service_id, 'custrecord_service');
                                    if (service_type == 22) {
                                        admin_fees_result = true;
                                    }
                                    var total_per_line = (service_rate * (service_qty + extra_qty));
                                    if (gst != 'No') {
                                        total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                        total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                    } else {
                                        total_per_customer = (total_per_customer + total_per_line);
                                        total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                    }
                                }

                            } else {

                                if (package_single_line == '1') {
                                    if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                                        log.debug({ title: 'Package Single Line is 1' });
                                    }
                                    if (service_type == 17) {
                                        single_line_discount = true;

                                        var total_per_line = (service_rate * (service_qty + extra_qty))
                                        if (gst != 'No') {
                                            total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                            total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                        } else {
                                            total_per_customer = (total_per_customer + total_per_line);
                                            total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                        }
                                    } else {
                                        if (package_period != 3) {
                                            if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (inv_if_incomplete == '1')) {
                                                service_count += (service_qty + extra_qty);
                                            }
                                        } else {
                                            service_count = 1;
                                        }
                                    }
                                    if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                                        log.debug({ title: 'Package Single Line is 1. Service Count: ', details: service_count });
                                    }

                                } else {
                                    if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                                        log.debug({ title: 'Package Single Line is 0' });
                                    }
                                    if (service_type == 17) {
                                        single_line_discount = true;
                                    }
                                    if (single_line_discount == true) {
                                        if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (isNullorEmpty(invoiceable) && service_category != '1')) {
                                            var total_per_line = (service_rate * (service_qty + extra_qty));
                                            if (gst != 'No') {
                                                total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                                total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                            } else {
                                                total_per_customer = (total_per_customer + total_per_line);
                                                total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                            }
                                        }
                                    } else {
                                        if (package_period != 3) {
                                            if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (inv_if_incomplete == '1')) {
                                                service_count += (service_qty + extra_qty);
                                            }
                                        } else {
                                            service_count = 1;
                                        }
                                    }
                                }
                            }

                        } else {
                            if (old_customer_name == 'B & R Enclosures Pty Ltd - Heathwood') {
                                log.debug({ title: 'Last Extra' });
                            }
                            if (old_package_id != package_id) {
                                if (single_line_discount == false) {
                                    if (service_count > 1 && service_unique_count != 0) {
                                        service_count = service_count / service_unique_count;
                                    }
                                    total_per_customer = total_per_customer + ((old_package_fix_rate * service_count) * 1.1);
                                    total_comm_per_customer = total_comm_per_customer + (((zee_comm * ((old_package_fix_rate * service_count))) / 100) * 1.1);
                                }
                                single_line_discount = false;
                                service_count = 0;
                                service_unique_count = 0;
                            }

                            service_unique_count++;
                            if (isNullorEmpty(package_id)) {
                                if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (isNullorEmpty(invoiceable) && service_category != '1')) {
                                    var total_per_line = (service_rate * (service_qty + extra_qty));
                                    if (gst != 'No') {
                                        total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                        total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                    } else {
                                        total_per_customer = (total_per_customer + total_per_line);
                                        total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                    }
                                }
                            } else {
                                if (old_package_single_line == '1') {
                                    if (service_type == 17) {
                                        single_line_discount = true;

                                        var total_per_line = (service_rate * (service_qty + extra_qty));
                                        if (gst != 'No') {
                                            total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                            total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                        } else {
                                            total_per_customer = (total_per_customer + total_per_line);
                                            total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                        }

                                    } else {
                                        // service_unique_count++;
                                        if (package_period != 3) {
                                            if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (inv_if_incomplete == '1')) {
                                                service_count += (service_qty + extra_qty);
                                            }
                                        } else {
                                            service_count = 1;
                                        }
                                    }

                                } else {
                                    if (single_line_discount == true) {
                                        if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1')) {
                                            var total_per_line = (service_rate * (service_qty + extra_qty));
                                            if (gst != 'No') {
                                                total_per_customer = total_per_customer + (total_per_line + (total_per_line * global_gst));
                                                total_comm_per_customer = total_comm_per_customer + ((zee_comm * (total_per_line + (total_per_line * global_gst))) / 100);
                                            } else {
                                                total_per_customer = (total_per_customer + total_per_line);
                                                total_comm_per_customer = total_comm_per_customer + ((zee_comm * total_per_line) / 100);
                                            }
                                        }
                                    } else {
                                        // service_unique_count++;
                                        if (package_period != 3) {
                                            if (invoiceable == 'Yes' || (isNullorEmpty(invoiceable) && jobGroupStatus == '1') || (inv_if_incomplete == '1')) {
                                                service_count += (service_qty + extra_qty);
                                            }
                                        } else {
                                            service_count = 1;
                                        }
                                    }
                                }
                            }

                        }
                    }
                }

                old_customer_id = customerInternalID;
                old_service_id = service_id;
                old_service_type = service_type;
                old_service_rate = service_rate;
                old_service_qty = service_qty;
                old_extra_qty = extra_qty;
                old_customer_name = companyName;
                old_ID = ID;
                old_service_text = service_text;
                old_package_id = package_id;
                old_package_single_line = package_single_line;
                old_package_period = package_period;
                old_package_fix_rate = package_fix_rate;
                old_invoice_id = invoice_id;
                old_invoice_text = invoice_text;
                old_invoiceable = invoiceable;
                old_jobGroupStatus = jobGroupStatus;
                old_admin_fess = admin_fees;
                old_invoice_total = invoice_total;
                old_invoice_custom = invoice_custom;
                old_customer_partner = customer_partner;
                old_date_reviewed = dateReviewed;

                old_sc_ID = specialCustomerInternalID;
                old_sc_name = specialCustomerName;
                old_sc_entity_id = scID;
                old_sc_company_name = specialCompanyName;


                if (!isNullorEmpty(date_invoiced)) {
                    invoiced = true;
                    invoiced_count++;
                } else if (!isNullorEmpty(date_inv_finalised)) {
                    reviewed = true;
                    reviewed_count++;
                }

                if (!isNullorEmpty(date_reviewed) && edit != false) {
                    edit = true;
                    edit_count++;
                } else {
                    edit = false;
                }

                countCustomers++;
                return true;
            });


            if (countCustomers > 0) {
                var admin_fess = search.lookupFields({
                    type: 'customer',
                    id: old_customer_id,
                    columns: 'custentity_admin_fees'
                });


                var customer_locked = '';
                var lock_class = '';
                

                var unique_zee_comm_array = [];
                unique_zee_comm_array = zee_comm_array.filter(function(elem, index, self) {
                    return index == self.indexOf(elem);
                });

                var min_zee_comm = Math.min(unique_zee_comm_array);

                if (!isNullorEmpty(old_admin_fess) && admin_fees_result == false && isNullorEmpty(old_date_reviewed)) {
                    total_per_customer = total_per_customer + (old_admin_fess * 1.1);
                    total_comm_per_customer = total_comm_per_customer + (((min_zee_comm * (old_admin_fess)) / 100) * 1.1);
                }

                if (invoiced == true) {
                    if (isNullorEmpty(old_sc_ID)) {
                        inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align:left;">' + old_customer_name + '</p></td>';

                    } else {
                        inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align:left;">' + old_sc_company_name + '</p></td>';
                    }


                    if (old_invoice_custom == 2 || isNullorEmpty(old_invoice_custom)) {
                        inlineQty += '<td><button type="button" id="invoice_customer" onclick="onclickContinueReview(' + old_customer_id + ',\'yes\', ' + old_sc_ID + ')" class="form-control btn btn-success active invoice_customer ">INVOICED  <span class="glyphicon glyphicon-lock"></span></button></td>';
                    } else {
                        inlineQty += '<td><button type="button" id="invoice_customer"  onclick="onclickContinueReview(' + old_customer_id + ',\'yes\', ' + old_sc_ID + ')" class="form-control btn btn-default invoice_customer active">CUSTOM INVOICE  <span class="glyphicon glyphicon-lock"></span></button></td>';
                    }
                    if (roundTwoDec(total_per_customer) == roundTwoDec(old_invoice_total)) {
                        inlineQty += '<td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td>';
                        if (isNullorEmpty(old_invoice_id)) {
                            inlineQty += '<td>NO INVOICE</td></tr>';
                        } else {
                            inlineQty += '<td><a href="' + baseURL + '/app/accounting/transactions/custinvc.nl?id=' + old_invoice_id + '" target="_blank">' + old_invoice_text + '</a></td></tr>';
                        }

                    } else {
                        inlineQty += '<td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (old_invoice_total).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td>';
                        if (isNullorEmpty(old_invoice_id)) {
                            inlineQty += '<td>NO INVOICE</td></tr>';
                        } else {
                            inlineQty += '<td><a href="' + baseURL + '/app/accounting/transactions/custinvc.nl?id=' + old_invoice_id + '" target="_blank">' + old_invoice_text + '</a></td></tr>';
                        }
                    }
                } else if (reviewed == true) {
                    if (isNullorEmpty(old_sc_ID)) {
                        inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align:left;">' + old_customer_name + '</p></td><td><input type="button" id="invoice_customer" value="FINALISED" onclick="onclickContinueReview(' + old_customer_id + ',\'yes\', ' + old_sc_ID + ')" class="form-control btn btn-info invoice_customer"> </td>';

                    } else {
                        inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align:left;">' + old_sc_company_name + '</p></td><td><input type="button" id="invoice_customer" value="FINALISED" onclick="onclickContinueReview(' + old_customer_id + ',\'yes\', ' + old_sc_ID + ')" class="form-control btn btn-info invoice_customer"> </td>';
                    }


                    inlineQty += '<td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" style="text-align:right;" class="form-control total_monthly_invoice" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td><td>' + old_invoice_id + '</td></tr>';


                } else if (edit == true) {
                    if (isNullorEmpty(old_sc_ID)) {
                        inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align: left;">' + old_customer_name + '</p></td>';
                    } else {
                        inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align: left;">' + old_sc_company_name + '</p></td>';
                    }


                    inlineQty += '<td><button type="button" id="invoice_customer" value="EDIT" onclick="onclickContinueReview(' + old_customer_id + ', \'' + customer_locked + '\', ' + old_sc_ID + ')" class="form-control btn btn-primary invoice_customer">EDIT <span class="' + lock_class + '"></span></button></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td><td>' + old_invoice_id + '</td></tr>';
                } else {
                    if (isNullorEmpty(old_sc_ID)) {
                        inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_customer_id + '" target="_blank"><p style="text-align:left;">' + old_ID + '</p></a></td><td><p style="text-align: left;">' + old_customer_name + '</p></td>';
                    } else {
                        inlineQty += '<tr><td><a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + old_sc_ID + '" target="_blank"><p style="text-align:left;">' + old_sc_entity_id + '</p></a></td><td><p style="text-align: left;">' + old_sc_company_name + '</p></td>';
                    }

                    inlineQty += '<td><button type="button" id="invoice_customer" value="REVIEW" onclick="onclickContinueReview(' + old_customer_id + ', \'' + customer_locked + '\', ' + old_sc_ID + ')" class="form-control btn btn-danger invoice_customer">REVIEW <span class="' + lock_class + '"></span></button> </td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_per_customer).toFixed(2) + '" readonly /></div></td><td><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" style="text-align:right;" value="' + (total_comm_per_customer).toFixed(2) + '" readonly /></div></td><td>' + old_invoice_id + '</td></tr>';
                }
                total_monthly_invoice += total_per_customer;
                total_monthly_comm += total_comm_per_customer;
            } else {
                inlineQty += '<tr><td></td><td></td><td><b>NO CUSTOMERS TO REVIEW</b></td><td></td><td></td><td></td></tr>';
            }


            inlineQty += '</tbody>';
            inlineQty += '</table></div><br/>';

            inlinehtml2 += '<br/><label>Total Exp Invoice Amount</label><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_invoice" value="' + (total_monthly_invoice).toFixed(2) + '" readonly /></div>';
            inlinehtml2 += '<label>Total Exp Distribution Amount</label><div class="input-group"><span class="input-group-addon">$</span><input type="number" class="form-control total_monthly_comm" value="' + (total_monthly_comm).toFixed(2) + '" readonly /></div>';
            inlinehtml2 += '<div><button type="button" id="dailyrevenue" value="DAILY REVENUE" class="form-control btn btn-primary" style="margin-top: 10px">Daily Revenue</button></div>';

            var edit_progress = 0.0;
            var remaining_progress = 0.0;
            var reviewed_progress = 0.0;
            var invoiced_progress = 0.0;

            edit_progress = (edit_count / countCustomers) * 100;
            remaining_progress = ((countCustomers - edit_count) / countCustomers) * 100;
            reviewed_progress = (reviewed_count / countCustomers) * 100;
            invoiced_progress = (invoiced_count / countCustomers) * 100;

            if (edit_progress > 0.00 && edit_progress < 100.00) {
                inlinehtml2 += '</br><label>Review Progress</label><div class="progress"><div class="progress-bar" style="width: ' + edit_progress + '%">' + edit_progress.toFixed(2) + '% </div><div class="progress-bar progress-bar-danger" style="width: ' + remaining_progress + '%">' + remaining_progress.toFixed(2) + '% (Remaining)</div></div>';
            }

            if (reviewed_progress > 0.00 && reviewed_progress < 100.00) {
                inlinehtml2 += '</br><label>Reviewed Progress</label><div class="progress"><div class="progress-bar progress-bar-info" style="width: ' + reviewed_progress + '%">' + reviewed_progress.toFixed(2) + '% </div></div>';
            }

            if (invoiced_progress > 0.00 && invoiced_progress < 100.00) {
                inlinehtml2 += '</br><label>Invoiced Progress</label><div class="progress"><div class="progress-bar progress-bar-success" style="width: ' + invoiced_progress + '%">' + invoiced_progress.toFixed(2) + '%</div></div></div>';
            }

            form.addField({
                id: 'custpage_html2',
                label: 'inlinehtml',
                type: ui.FieldType.INLINEHTML
            }).updateBreakType({
                breakType: ui.FieldLayoutType.STARTROW
            }).updateLayoutType({
                layoutType: ui.FieldLayoutType.OUTSIDEABOVE,
                padding: 1
            }).defaultValue = inlinehtml2;

            form.addField({
                id: 'preview_table',
                label: 'preview_table',
                type: ui.FieldType.INLINEHTML
            }).updateBreakType({
                breakType: ui.FieldLayoutType.STARTROW
            }).updateLayoutType({
                layoutType: ui.FieldLayoutType.OUTSIDEBELOW,
                padding: 1
            }).defaultValue = inlineQty;

            form.addField({ 
                id: 'partner', 
                type: ui.FieldType.TEXT, 
                label: 'Partner' 
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = zee;

            if (countCustomers == countTotalJobsInvoiceable) {
                startFinalize = true;
            }


            if (countCustomers == edit_count && countCustomers != 0) {
                var button = finalise_date();
                if (button == true || role == 3 || role == 1032 || zee == 6 || zee == 425904) {

                    //WS Edit: should not be && on invoiced_count

                    if (reviewed_count > 0 || invoiced_count == countCustomers) {
                        //DONT SHOW FINALISE BUTTON
                    } else {

                        if (role == 3) {
                            form.addSubmitButton({ label: 'FINALISE' });
                            
                            form.addButton({ id: 'run_finalise', label: 'RUN FINALISE SCRIPT', functionName: 'onclick_Finalise()' });
                        } else {
                            form.addSubmitButton({ label: 'FINALISE' });
                            form.addButton({ id: 'finalise', label: 'FINALISE', functionName: 'onclick_Finalise()' });
                        }
                    }
                }
            } else if (edit_count == 0 && countCustomers != 0) {
                form.addButton({ id: 'cust_back1', label: 'START REVIEW ', functionName: 'onclickContinueReview()' });
            } else if (edit_count > 0 && reviewed_count == 0) {
                form.addButton({ id: 'cust_back1', label: 'CONTINUE REVIEW ', functionName: 'onclickContinueReview()' });
            }

            if (role == 3) {
                form.addSubmitButton({ label: 'FINALISE' });
                form.addButton({ id: 'run_finalise', label: 'RUN FINALISE SCRIPT', functionName: 'onclick_Finalise()' });
            }

            form.clientScriptFileId = 4605933; //; // SB = 4605933

            context.response.writePage(form);
            var end_time = Date.now();
            log.debug({ title: 'loading_time', details: end_time - start_time });
        
        } else {

            var partner = context.request.parameters.partner;
            var start_date = context.request.parameters.start_date;
            var end_date = context.request.parameters.end_date;
    
            /**
             * [params description] - Paramters that needs to be passed to the scheduled script to set the date Invoiced
             * @type {Object}
             */
            var params = {
                custscript_partner: partner,
                custscript_startdate: start_date,
                custscript_enddate: end_date
            }
    
            /**
             * [status description] -  Schedule Script to set the date Invoiced for all the jobs associated to the franchisee for that invoicing period.
             */
            if (role == 3) {
                for (var x = 1; x <= 10; x++) {
                    var status = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        deploymentId: 'customdeploy' + x,
                        params: params,
                        scriptId: 'customscript_sc_date_inv_finalised',
                    });

                    status.submit();
    
                    if (status == 'QUEUED') {
                        break;
                    }
                }
            }
    
            // nlapiSendEmail(112209, ['ankith.ravindran@mailplus.com.au'], 'Invoicing Complete: ' + partner, null, null);
            var params = new Array();
            params['custevent_invoicing_complete'] = 'T';
            redirect.toRecord({
                id: 'task',
                type: null,
                isEditMode: true,
                parameters: params
            });

        }
    }

    function service_start_end_date(date_finalised) {

        var split_date = date_finalised.split('/');
    
        var date = new Date();
        var firstDay = new Date(date.getFullYear(), parseInt(split_date[1]) - 1, 1);
        var lastDay = new Date(date.getFullYear(), split_date[1], 0);
    
        var service_range = [];

        service_range[0] = format.format({
            value: firstDay,
            type: format.Type.DATE
        });
        service_range[1] = format.format({
            value: lastDay,
            type: format.Type.DATE
        });
    
        return service_range;
    
    }

    /**
     * [getDate description] - To get the current date (Suitlet)
     * @return {string} String of the current date
     */
    function getDate() {
        var date = new Date();
        if (date.getHours() > 6) {
            date.setDate(date.getDate() + 1);
        }
        date = format.format({
            value: date,
            type: format.Type.DATE
        });

        return date;
    }

    
    //To check if todays date falls between the below criteria.
    function finalise_date() {

        var date = new Date();

        if (date.getHours() > 6) {
            date.setDate(date.getDate() + 1);
        }

        var month = date.getMonth(); //Months 0 - 11
        
        var today = date.getDate();
        var year = date.getFullYear();

        var lastDay = new Date(year, (month + 1), 0);


        if (lastDay.getDay() == 0) {
            lastDay.setDate(lastDay.getDate() - 2);
        } else if (lastDay.getDay() == 6) {
            lastDay.setDate(lastDay.getDate() - 1);
        }

        var lastWorkingDay = lastDay.getDate();

        lastDay.setDate(lastDay.getDate() + 5);


        var button = false;

        //If allocator run on the first day of the month, it takes the last month as the filter
        if (lastWorkingDay == today || today <= lastDay.getDate()) {
            button = true;
        }
        return button;
    }

    // Get the previous month first and last day
    function start_end_date() {

        var date = new Date();

        var month = date.getMonth(); //Months 0 - 11
        var day = date.getDate();
        var year = date.getFullYear();

        if (day == 1 || day == 2 || day == 3 || day == 4 || day == 5) {
            if (month == 0) {
                month = 11;
                year = year - 1
            } else {
                month = month - 1;
            }
        }
        var firstDay = new Date(year, (month), 1);
        var lastDay = new Date(year, (month + 1), 0);

        var service_range = [];

        service_range[0] = format.format({
            value: firstDay,
            type: format.Type.DATE
        });

        service_range[1] = format.format({
            value: lastDay,
            type: format.Type.DATE
        });

        return service_range;
    }

    function isNullorEmpty(strVal) {
        return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
    }
    
    return {
        onRequest: onRequest
    };
 
 });