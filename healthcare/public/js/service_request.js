
frappe.ui.form.on(cur_frm.doctype, { // nosemgrep
    onload: function(frm) {
        if (frm.doc.__islocal) {
			frm.set_value('order_time', frappe.datetime.now_time())
		}
    },

    refresh: function(frm) {
		frm.set_query('order_group', function () {
			return {
				filters: {
					'docstatus': 1,
					'patient': frm.doc.patient,
					'practitioner': frm.doc.ordered_by
				}
			};
		});

		frm.set_query('patient', function () {
			return {
				filters: {
					'status': 'Active'
				}
			};
		});

		frm.set_query('staff_role', function () {
			return {
				filters: {
					'restrict_to_domain': 'Healthcare'
				}
			};
		});

		frm.set_query('priority', function () {
			return {
				filters: {
					code_system: 'Priority'
				}
			};
		});

		frm.set_query('intent', function () {
			return {
				filters: {
					code_system: 'Intent'
				}
			};
		});

		frm.trigger('setup_status_buttons');
	},

    setup_status_buttons: function(frm) {
		var active = on_hold = revoked = unknown = entered_in_error = ""
		if (frm.doc.doctype == "Service Request") {
			active = "active-Request Status"
			on_hold = "on-hold-Request Status"
			revoked = "revoked-Request Status"
			unknown = "unknown-Request Status"
			entered_in_error = "entered-in-error-Request Status"
			// replaced = "replaced-Request Status"
		} else if (frm.doc.doctype == "Medication Request") {
			active = "active-Medication Request Status"
			on_hold = "on-hold-Medication Request Status"
			revoked = "cancelled-Medication Request Status"
			unknown = "unknown-Medication Request Status"
			entered_in_error = "entered-in-error-Medication Request Status"
			// replaced = "replaced-Request Status"
		}

		if (frm.doc.docstatus === 1) {

			if (frm.doc.status === active) {
				frm.add_custom_button(__('On Hold'), function() {
					frm.events.set_status(frm, on_hold);
				}, __('Status'));

				// frm.add_custom_button(__('Completed'), function() {
				// 	frm.events.set_status(frm, 'Completed');
				// }, __('Status'));
			}

			if (frm.doc.status === on_hold) {
				frm.add_custom_button(__('Active'), function() {
					frm.events.set_status(frm, active);
				}, __('Status'));

				// frm.add_custom_button(__('Completed'), function() {
				// 	frm.events.set_status(frm, 'Completed');
				// }, __('Status'));
			}

		} else if (frm.doc.docstatus === 2) {

			frm.add_custom_button(__('Revoked'), function() {
				frm.events.set_status(frm, revoked);
			}, __('Status'));

			frm.add_custom_button(__('Entered in Error'), function() {
				frm.events.set_status(frm, entered_in_error);
			}, __('Status'));

			frm.add_custom_button(__('Unknown'), function() {
				frm.events.set_status(frm, unknown);
			}, __('Status'));

		}
	},

    set_status: function(frm, status) {
		frappe.call({
			method: 'healthcare.controllers.service_request_controller.set_request_status',
			async: false,
			freeze: true,
			args: {
				doctype: frm.doctype,
				request: frm.doc.name,
				status: status
			},
			callback: function(r) {
				if (!r.exc) frm.reload_doc();
			}
		});
	},

    after_cancel: function(frm) {
		frappe.prompt([
			{
				fieldname: 'reason_for_cancellation',
				label: __('Reason for Cancellation'),
				fieldtype: 'Select',
				options: [
					{ label: "Revoked", value: "revoked-Request Status" },
					{ label: "Entered in Error", value: "entered-in-error-Request Status" },
					{ label: "Unknown", value:"unknown-Request Status"},
				],
				reqd: 1
			}
		],
		function(data) {
			frm.events.set_status(frm, data.reason_for_cancellation);
		}, __('Reason for Cancellation'), __('Submit'));
	},

    patient: function(frm) {
		if (!frm.doc.patient) {
			frm.set_values ({
				'patient_name': '',
				'gender': '',
				'patient_age': '',
				'mobile': '',
				'email': '',
				'inpatient_record': '',
				'inpatient_status': '',
			});
		}
	},

    birth_date: function(frm) {
		let age_str = calculate_age(frm.doc.birth_date);
		frm.set_value('patient_age', age_str);
	}
});

let calculate_age = function(birth) {
	let ageMS = Date.parse(Date()) - Date.parse(birth);
	let age = new Date();
	age.setTime(ageMS);
	let years =  age.getFullYear() - 1970;
	return `${years} ${__('Years(s)')} ${age.getMonth()} ${__('Month(s)')} ${age.getDate()} ${__('Day(s)')}`;
};