const schemaText = `Table: marsad.administered_by_role
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.admission_source
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.admission_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.anesthesia_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.appointment_booked_mode
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.appointment_status
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.appointment_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.arrival_method
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.baby_presentation
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)
  - category (type/Text)

Table: marsad.bed_class
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.bed_management
Columns:
  - id (type/BigInteger)
  - admitting_diagnosis (type/Text)
  - bed_no (type/Text)
  - encounter_number (type/Text)
  - facility_code_nhic (type/Text)
  - medical_record_number (type/Text)
  - patient_unique_number (type/Text)
  - principal_diagnosis (type/Text)
  - room_no (type/Text)
  - specialty (type/Text)
  - start_date_time (type/DateTime)
  - bed_class_code (type/Text)
  - bed_status_code (type/Text)
  - isolation_room_status_code (type/Text)
  - patient_id (type/BigInteger)
  - provider_id (type/BigInteger)
  - room_type_code (type/Text)
  - ward_code (type/Text)

Table: marsad.bed_status
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.birth_order
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.birth_outcome
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.birth_plurality
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.blood_bank
Columns:
  - id (type/BigInteger)
  - blood_bank_code (type/Text)
  - blood_bank_name (type/Text)
  - blood_request_date_time (type/DateTime)
  - encounter_number (type/Text)
  - expiry_date (type/DateTime)
  - facility_code_nhic (type/Text)
  - patient_unique_number (type/Text)
  - transfusion_date_time (type/DateTime)
  - blood_component_code (type/Text)
  - blood_group_code (type/Text)
  - inpatient_id (type/Text)
  - patient_id (type/BigInteger)
  - provider_id (type/BigInteger)

Table: marsad.blood_component
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.blood_group
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.child_gender
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/Text)

Table: marsad.childbirth
Columns:
  - encounter_number (type/Text)
  - anesthesia_type (type/Text)
  - apgar_score_10_mins (type/BigInteger)
  - apgar_score_15_mins (type/BigInteger)
  - apgar_score_5_mins (type/BigInteger)
  - child_medical_record_number (type/Text)
  - child_nationality (type/Text)
  - delivery_date_time (type/DateTime)
  - delivery_physician_id (type/Text)
  - delivery_physician_name (type/Text)
  - discharge_date_time (type/DateTime)
  - episiotomy_performed_flag (type/BigInteger)
  - facility_code_nhic (type/Text)
  - labor_complications (type/Text)
  - medical_record_number (type/Text)
  - neonatal_complications (type/Text)
  - patient_unique_number (type/Text)
  - baby_presentation_code (type/Text)
  - birth_order_code (type/Text)
  - birth_outcome_code (type/Text)
  - birth_plurality_code (type/Text)
  - child_gender_code (type/Text)
  - delivery_type_code (type/Text)
  - discharge_disposition_code (type/Text)
  - labor_onset_method_code (type/Text)
  - lacerations_code (type/Text)
  - membrane_status_code (type/Text)
  - patient_id (type/BigInteger)
  - place_of_delivery_code (type/Text)
  - provider_id (type/BigInteger)

Table: marsad.consultation_service_mode
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.death
Columns:
  - encounter_number (type/Text)
  - cause_of_death_free_text (type/Text)
  - cause_of_death_icd_10_code (type/Text)
  - death_date_time (type/DateTime)
  - facility_code_nhic (type/Text)
  - medical_record_number (type/Text)
  - patient_unique_number (type/Text)
  - main_cause_of_hajj_mortality_code (type/Text)
  - patient_id (type/BigInteger)
  - place_of_death_code (type/Text)
  - provider_id (type/BigInteger)

Table: marsad.delivery_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.dental_anesthesia_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/Text)

Table: marsad.dental_case_priority
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.dental_case_status
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.dental_opd
Columns:
  - encounter_number (type/Text)
  - anesthesia_dose (type/Text)
  - case_assigned_to_technician_date_time (type/DateTime)
  - date_time_finished_by_technician (type/DateTime)
  - date_time_received_by_technician (type/DateTime)
  - delivered_to_clinic_date_time (type/DateTime)
  - dental_lab_procedure_name (type/Text)
  - dmft_score (type/BigInteger)
  - facility_code_nhic (type/Text)
  - lab_request_date_time (type/DateTime)
  - lab_section (type/Text)
  - lab_technician_id (type/Text)
  - lab_technician_name (type/Text)
  - laboratory_id (type/Text)
  - laboratory_name (type/Text)
  - medical_record_number (type/Text)
  - pain_level_scale (type/BigInteger)
  - patient_unique_number (type/Text)
  - patient_visit_date_time (type/DateTime)
  - procedure_date_time (type/DateTime)
  - rad_request_date_time (type/DateTime)
  - rad_technician_id (type/Text)
  - rad_technician_name (type/Text)
  - reason_for_visit_or_chief_complaint (type/Text)
  - received_to_clinic_date_time (type/DateTime)
  - referral_issue_date_time (type/DateTime)
  - referral_response_date_time (type/DateTime)
  - referral_status_priority (type/Text)
  - requested_from (type/Text)
  - school_city (type/Text)
  - school_id (type/Text)
  - school_name (type/Text)
  - school_neighborhood (type/Text)
  - school_region (type/Text)
  - screening_date_time (type/DateTime)
  - seated_date_time (type/DateTime)
  - sent_from_clinic_date_time (type/DateTime)
  - sent_from_lab_date_time (type/DateTime)
  - student_dmft_score (type/BigInteger)
  - student_id (type/Text)
  - tooth_number (type/BigInteger)
  - tooth_part (type/Text)
  - tooth_region (type/Text)
  - tooth_surface (type/Text)
  - anesthesia_type_code (type/Text)
  - dental_case_priority_code (type/Text)
  - dental_case_status_code (type/Text)
  - patient_id (type/BigInteger)
  - provider_id (type/BigInteger)
  - requested_rad_service_code (type/Text)
  - school_sector_code (type/Text)

Table: marsad.dialysis
Columns:
  - encounter_number (type/Text)
  - dialysis_end_date_time (type/DateTime)
  - dialysis_start_date_time (type/DateTime)
  - facility_code_nhic (type/Text)
  - medical_record_number (type/Text)
  - patient_unique_number (type/Text)
  - post_dialysis_weight (type/Float)
  - pre_dialysis_weight (type/Float)
  - dialysis_type_code (type/Text)
  - patient_id (type/BigInteger)
  - provider_id (type/BigInteger)

Table: marsad.dialysis_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.discharge_disposition
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.ed_discharge_disposition
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.emergency
Columns:
  - encounter_number (type/Text)
  - admit_location (type/Text)
  - allergies_documented_flag (type/BigInteger)
  - decision_to_admit_date_time (type/DateTime)
  - diagnosis_related_group (type/Text)
  - diastolic_blood_pressure (type/BigInteger)
  - discharge_date_time (type/DateTime)
  - discharge_destination (type/Text)
  - facility_code_nhic (type/Text)
  - heart_rate (type/BigInteger)
  - height (type/Float)
  - lab_order_id (type/Text)
  - medical_record_number (type/Text)
  - pain_level_scale (type/BigInteger)
  - patient_unique_number (type/Text)
  - patient_visit_date_time (type/DateTime)
  - physician_assignment_date_time (type/DateTime)
  - physician_id (type/Text)
  - physician_name (type/Text)
  - prescription_order_id (type/Text)
  - principal_diagnosis (type/Text)
  - rad_order_id (type/Text)
  - reason_for_visit_or_chief_complaint (type/Text)
  - respiratory_rate (type/BigInteger)
  - secondary_diagnosis (type/Text)
  - spo2 (type/Float)
  - systolic_blood_pressure (type/BigInteger)
  - temperature (type/Float)
  - triage_date_time (type/DateTime)
  - weight (type/Float)
  - arrival_method_code (type/Text)
  - ed_discharge_disposition_code (type/Text)
  - major_diagnostic_category_code (type/Text)
  - patient_id (type/BigInteger)
  - patient_clinical_complexity_level_code (type/Text)
  - provider_id (type/BigInteger)
  - triage_level_code (type/Text)

Table: marsad.encounter_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.facility_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.gender
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.hajj_mortality_cause
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.hajj_non_hajj_patient
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.his_scheduling
Columns:
  - id (type/BigInteger)
  - clinic_room_name (type/Text)
  - doctor_id (type/Text)
  - doctor_name (type/Text)
  - facility_code_nhic (type/Text)
  - facility_moh_id (type/Text)
  - schedule_active_end_date (type/DateTime)
  - schedule_active_start_date (type/DateTime)
  - shift_active_days_of_week (type/Text)
  - shift_active_weeks (type/Text)
  - shift_end_time (type/Time)
  - shift_start_time (type/Time)
  - slot_date (type/DateTime)
  - slot_duration (type/Float)
  - slot_end_time (type/Time)
  - slot_start_time (type/Time)
  - specialty (type/Text)
  - provider_id (type/BigInteger)
  - shift_type_code (type/Text)
  - slot_status_code (type/Text)
  - slot_type_code (type/Text)

Table: marsad.immunization_vaccination
Columns:
  - id (type/BigInteger)
  - administered_by_id (type/Text)
  - administered_by_name (type/Text)
  - administered_date_time (type/DateTime)
  - encounter_number (type/Text)
  - facility_code_nhic (type/Text)
  - immunization_vaccine_batch_id (type/Text)
  - immunization_vaccine_brand_name (type/Text)
  - immunization_vaccine_expiry_date (type/DateTime)
  - immunization_vaccine_moh_id (type/Text)
  - immunization_vaccine_name (type/Text)
  - immunization_vaccine_nhic_id (type/Text)
  - immunization_vaccine_production_date (type/DateTime)
  - medical_record_number (type/Text)
  - patient_unique_number (type/Text)
  - administered_by_role_code (type/Text)
  - patient_id (type/BigInteger)
  - provider_id (type/BigInteger)

Table: marsad.inpatient
Columns:
  - encounter_number (type/Text)
  - admission_date_time (type/DateTime)
  - admitting_physician_id (type/Text)
  - admitting_physician_name (type/Text)
  - attending_physician_id (type/Text)
  - attending_physician_name (type/Text)
  - bed_no (type/Text)
  - diagnosis_related_group (type/Text)
  - discharge_date_time (type/DateTime)
  - facility_code_nhic (type/Text)
  - lab_order_id (type/Text)
  - medical_record_number (type/Text)
  - patient_clinical_complexity_level (type/Text)
  - patient_unique_number (type/Text)
  - principal_diagnosis (type/Text)
  - procedure_code (type/Text)
  - procedure_name (type/Text)
  - rad_order_id (type/Text)
  - room_no (type/Text)
  - secondary_diagnosis (type/Text)
  - specialty (type/Text)
  - admission_source_code (type/Text)
  - admission_type_code (type/Text)
  - discharge_disposition_code (type/Text)
  - major_diagnostic_category_code (type/Text)
  - patient_id (type/BigInteger)
  - provider_id (type/BigInteger)
  - ward_code (type/Text)

Table: marsad.inpatient_admission_assessment
Columns:
  - encounter_number (type/Text)
  - alcohol_status_flag (type/Text)
  - allergies_documented_flag (type/Text)
  - diastolic_blood_pressure (type/BigInteger)
  - facility_code_nhic (type/Text)
  - fall_assessment_flag (type/Text)
  - hearing_impairment_flag (type/Text)
  - heart_rate (type/BigInteger)
  - height (type/Float)
  - medical_record_number (type/Text)
  - pain_level_scale (type/BigInteger)
  - patient_unique_number (type/Text)
  - respiratory_rate (type/BigInteger)
  - smoking_status_flag (type/Text)
  - spo2 (type/Float)
  - systolic_blood_pressure (type/BigInteger)
  - temperature (type/Float)
  - vision_impairment_flag (type/Text)
  - walking_impairment_flag (type/Text)
  - weight (type/Float)
  - inpatient_id (type/Text)
  - patient_id (type/BigInteger)
  - provider_id (type/BigInteger)

Table: marsad.isolation_room_status
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.lab_order_priority
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.labor_onset_method
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.laboratory
Columns:
  - lab_order_id (type/Text)
  - encounter_number (type/Text)
  - facility_code_nhic (type/Text)
  - lab_order_date_time (type/DateTime)
  - lab_order_name (type/Text)
  - lab_order_test_code (type/Text)
  - lab_section (type/Text)
  - lab_specimen_type (type/Text)
  - medical_record_number (type/Text)
  - patient_unique_number (type/Text)
  - receiving_date_time (type/DateTime)
  - requested_from (type/Text)
  - result_date_time (type/DateTime)
  - result_reference_range (type/Text)
  - result_reviewed_by_id (type/Text)
  - result_reviewed_by_name (type/Text)
  - result_status (type/Text)
  - result_test_name (type/Text)
  - result_units (type/Text)
  - result_value (type/Text)
  - sampling_date_time (type/DateTime)
  - encounter_type_code (type/Text)
  - lab_order_priority_code (type/Text)
  - patient_id (type/BigInteger)
  - provider_id (type/BigInteger)
  - result_interpretation_code (type/Text)
  - result_value_type_code (type/Text)

Table: marsad.lacerations
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.major_diagnostic_category
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.marital_status
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.mawid_appointment
Columns:
  - appointment_code (type/Text)
  - appointment_booking_date_time (type/DateTime)
  - appointment_date (type/DateTime)
  - appointment_end_time (type/Time)
  - appointment_start_time (type/Time)
  - facility_moh_id (type/Text)
  - patient_arrival_date_time (type/DateTime)
  - patient_name (type/Text)
  - patient_national_id (type/Text)
  - referred_by_facility_code (type/Text)
  - service_category (type/Text)
  - service_name (type/Text)
  - service_type (type/Text)
  - appointment_status_code (type/Text)
  - appointment_type_code (type/Text)
  - booked_by_role_code (type/Text)
  - facility_type_code (type/Text)
  - gender_code (type/Text)
  - provider_id (type/BigInteger)
  - referral_type_code (type/Text)
  - referred_by_facility_type_code (type/Text)
  - service_code (type/Text)

Table: marsad.mawid_appointment_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.mawid_booked_by_role
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.mawid_scheduling
Columns:
  - id (type/BigInteger)
  - allowed_only_for_saudi_nid_flag (type/BigInteger)
  - available_slot_count (type/BigInteger)
  - blocked_slot_count (type/BigInteger)
  - booked_slot_count (type/BigInteger)
  - booking_window_in_days (type/BigInteger)
  - facility_moh_id (type/Text)
  - provider_count (type/BigInteger)
  - schedule_config_end_time (type/Time)
  - schedule_config_start_time (type/Time)
  - schedule_date (type/DateTime)
  - service_name (type/Text)
  - slot_duration (type/Float)
  - total_slot_count (type/BigInteger)
  - provider_id (type/BigInteger)
  - service_code (type/Text)
  - service_category_code (type/Text)
  - service_type_code (type/Text)

Table: marsad.mawid_service_category
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.mawid_service_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.membrane_status
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.nationality
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.outpatient
Columns:
  - id (type/BigInteger)
  - allergies_documented_flag (type/Text)
  - appointment_booked_person (type/Text)
  - appointment_booking_date_time (type/DateTime)
  - appointment_schedule_date_time (type/DateTime)
  - clinic_room_name (type/Text)
  - date_of_referral (type/DateTime)
  - diastolic_blood_pressure (type/BigInteger)
  - discharge_date_time (type/DateTime)
  - encounter_number (type/Text)
  - examination_start_date_time (type/DateTime)
  - facility_code_nhic (type/Text)
  - heart_rate (type/BigInteger)
  - height (type/Float)
  - lab_order_id (type/Text)
  - medical_record_number (type/Text)
  - patient_unique_number (type/Text)
  - patient_visit_date_time (type/DateTime)
  - physician_id (type/Text)
  - physician_name (type/Text)
  - prescription_order_id (type/Text)
  - principal_diagnosis (type/Text)
  - rad_order_id (type/Text)
  - reason_for_visit_or_chief_complaint (type/Text)
  - referring_facility_name (type/Text)
  - respiratory_rate (type/BigInteger)
  - secondary_diagnosis (type/Text)
  - specialty (type/Text)
  - spo2 (type/Float)
  - systolic_blood_pressure (type/BigInteger)
  - temperature (type/Float)
  - weight (type/Float)
  - appointment_booked_mode_code (type/Text)
  - appointment_type_code (type/Text)
  - consultation_service_mode_code (type/Text)
  - patient_id (type/BigInteger)
  - patient_type_code (type/Text)
  - provider_id (type/BigInteger)
  - referral_priority_code (type/Text)

Table: marsad.patient
Columns:
  - id (type/BigInteger)
  - date_of_birth (type/DateTime)
  - facility_code_nhic (type/Text)
  - facility_moh_id (type/Text)
  - healthcare_facility_name (type/Text)
  - insurance_company_id (type/Text)
  - insurance_company_name (type/Text)
  - insurance_plan_id (type/Text)
  - insurance_plan_type (type/Text)
  - insurance_policy_number (type/Text)
  - medical_record_number (type/Text)
  - patient_address (type/Text)
  - patient_name (type/Text)
  - patient_name_ar (type/Text)
  - patient_national_id (type/Text)
  - patient_phone_number (type/Text)
  - patient_unique_number (type/Text)
  - plan_effective_date (type/DateTime)
  - plan_expiration_date (type/DateTime)
  - blood_group_code (type/Text)
  - gender_code (type/Text)
  - hajj_non_hajj_patient_code (type/Text)
  - marital_status_code (type/Text)
  - nationality_code (type/Text)
  - patient_occupation_code (type/Text)
  - payer_id (type/BigInteger)
  - provider_id (type/BigInteger)
  - religion_code (type/Text)

Table: marsad.patient_clinical_complexity_level
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.patient_occupation
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.patient_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.payer
Columns:
  - id (type/BigInteger)
  - insurance_company_id (type/Text)
  - name (type/Text)
  - name_ar (type/Text)

Table: marsad.pharmacy_dispensed
Columns:
  - prescription_order_id (type/Text)
  - controlled_medicine_flag (type/BigInteger)
  - dispensed_date_time (type/DateTime)
  - dispensed_location (type/Text)
  - dispensed_quantity (type/Text)
  - dose_form (type/Text)
  - dose_quantity (type/Text)
  - dose_unit (type/Text)
  - duration (type/Text)
  - encounter_number (type/Text)
  - encounter_type (type/Text)
  - facility_code_nhic (type/Text)
  - frequency (type/Text)
  - frequency_condition (type/Text)
  - generic_medication_name (type/Text)
  - global_trade_item_number_gtin (type/Text)
  - medical_record_number (type/Text)
  - medicine_brand_name (type/Text)
  - nhic_medication_code (type/Text)
  - partial_refill_flag (type/Text)
  - patient_unique_number (type/Text)
  - pharmacist_id (type/Text)
  - pharmacist_name (type/Text)
  - pharmacy_order_code (type/Text)
  - pharmacy_order_name (type/Text)
  - physician_id (type/Text)
  - physician_name (type/Text)
  - prescription_date_time (type/DateTime)
  - remaining_refills (type/Text)
  - route_of_administration (type/Text)
  - was_substituted_flag (type/BigInteger)
  - patient_id (type/BigInteger)
  - provider_id (type/BigInteger)

Table: marsad.place_of_death
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.place_of_delivery
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.provider
Columns:
  - id (type/BigInteger)
  - facility_code_nhic (type/Text)
  - facility_moh_id (type/Text)
  - name (type/Text)
  - name_ar (type/Text)

Table: marsad.rad_order_priority
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.rad_schedule_flag
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.radiology
Columns:
  - rad_order_id (type/Text)
  - appointment_booked_person (type/Text)
  - appointment_booking_date_time (type/DateTime)
  - appointment_schedule_date_time (type/DateTime)
  - encounter_number (type/Text)
  - encounter_type (type/Text)
  - examination_end_date_time (type/DateTime)
  - examination_start_date_time (type/DateTime)
  - facility_code_nhic (type/Text)
  - medical_record_number (type/Text)
  - patient_unique_number (type/Text)
  - patient_visit_date_time (type/DateTime)
  - rad_order_name (type/Text)
  - rad_order_test_code (type/Text)
  - rad_report_date_time (type/DateTime)
  - radiographer_id (type/Text)
  - radiographer_name (type/Text)
  - radiologist_id (type/Text)
  - radiologist_name (type/Text)
  - referral_facility_name (type/Text)
  - request_date_time (type/DateTime)
  - result_status (type/Text)
  - appointment_booked_mode_code (type/Text)
  - appointment_type_code (type/Text)
  - patient_id (type/BigInteger)
  - provider_id (type/BigInteger)
  - rad_order_priority_code (type/Text)
  - rad_schedule_flag_code (type/Text)
  - referral_priority_code (type/Text)
  - requested_rad_service_code (type/Text)

Table: marsad.referral_priority
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.referral_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.religion
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.requested_rad_service
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.result_interpretation
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.result_value_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.room_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.school_sector
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.service
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.shift_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.slot_status
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.slot_type
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.surgery
Columns:
  - surgery_order_id (type/Text) -- This is a surgery-specific ID like "SURG-001", NOT a foreign key
  - anesthesia_minutes (type/BigInteger)
  - anesthesiologist_id (type/Text)
  - anesthesiologist_name (type/Text)
  - appointment_booked_person (type/Text)
  - appointment_booking_date_time (type/DateTime)
  - appointment_schedule_date_time (type/DateTime)
  - encounter_number (type/Text)
  - facility_code_nhic (type/Text)
  - medical_record_number (type/Text)
  - operating_theatre_number (type/Text)
  - operating_theatre_type (type/Text)
  - patient_unique_number (type/Text)
  - patient_visit_date_time (type/DateTime)
  - referral_facility_name (type/Text)
  - referral_priority (type/Text)
  - surgeon_id (type/Text)
  - surgeon_name (type/Text) -- The surgeon's name is stored here directly
  - surgery_end_date_time (type/DateTime)
  - surgery_order_priority (type/Text)
  - surgery_procedure_code (type/Text)
  - surgery_procedure_name (type/Text)
  - surgery_procedure_priority (type/Text)
  - surgery_request_date_time (type/DateTime)
  - surgery_scheduled_date_time (type/DateTime)
  - surgery_start_date_time (type/DateTime)
  - surgery_type (type/Text)
  - anesthesia_type_code (type/Text)
  - inpatient_id (type/Text)
  - patient_id (type/BigInteger)
  - provider_id (type/BigInteger) 

Table: marsad.triage_level
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)

Table: marsad.ward
Columns:
  - code (type/Text)
  - description (type/Text)
  - is_active (type/BigInteger)
  - category (type/Text)`;

return [{
  json: {
    schema: schemaText,
    question: $('matchQuery1').first().json.question
  }
}];