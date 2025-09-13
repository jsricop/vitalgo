--
-- PostgreSQL database dump
--

\restrict GgPA9JKXaSHp43r0Yh1JgGJsFpvw7BT5Qy8j0qyOFaVIWqxAjMdhgiLfmhsyz7U

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: allergy_severity; Type: TYPE; Schema: public; Owner: vitalgo_user
--

CREATE TYPE public.allergy_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.allergy_severity OWNER TO vitalgo_user;

--
-- Name: document_type; Type: TYPE; Schema: public; Owner: vitalgo_user
--

CREATE TYPE public.document_type AS ENUM (
    'CC',
    'TI',
    'CE',
    'PAS'
);


ALTER TYPE public.document_type OWNER TO vitalgo_user;

--
-- Name: gender_type; Type: TYPE; Schema: public; Owner: vitalgo_user
--

CREATE TYPE public.gender_type AS ENUM (
    'M',
    'F',
    'Other'
);


ALTER TYPE public.gender_type OWNER TO vitalgo_user;

--
-- Name: illness_status; Type: TYPE; Schema: public; Owner: vitalgo_user
--

CREATE TYPE public.illness_status AS ENUM (
    'ACTIVA',
    'CONTROLADA',
    'CURADA'
);


ALTER TYPE public.illness_status OWNER TO vitalgo_user;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: vitalgo_user
--

CREATE TYPE public.user_role AS ENUM (
    'patient',
    'paramedic',
    'admin'
);


ALTER TYPE public.user_role OWNER TO vitalgo_user;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: vitalgo_user
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'inactive',
    'suspended'
);


ALTER TYPE public.user_status OWNER TO vitalgo_user;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: vitalgo_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO vitalgo_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: vitalgo_user
--

CREATE TABLE public.admin_actions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    admin_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    target_type character varying(50),
    target_id uuid,
    details jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_actions OWNER TO vitalgo_user;

--
-- Name: allergies; Type: TABLE; Schema: public; Owner: vitalgo_user
--

CREATE TABLE public.allergies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid NOT NULL,
    allergen character varying(255) NOT NULL,
    severity public.allergy_severity DEFAULT 'medium'::public.allergy_severity NOT NULL,
    symptoms text,
    treatment text,
    diagnosed_date date,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.allergies OWNER TO vitalgo_user;

--
-- Name: TABLE allergies; Type: COMMENT; Schema: public; Owner: vitalgo_user
--

COMMENT ON TABLE public.allergies IS 'Patient allergies with severity levels and treatment information';


--
-- Name: eps; Type: TABLE; Schema: public; Owner: vitalgo_user
--

CREATE TABLE public.eps (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(10),
    phone character varying(20),
    website character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.eps OWNER TO vitalgo_user;

--
-- Name: TABLE eps; Type: COMMENT; Schema: public; Owner: vitalgo_user
--

COMMENT ON TABLE public.eps IS 'Colombian health insurance companies (EPS) catalog';


--
-- Name: illnesses; Type: TABLE; Schema: public; Owner: vitalgo_user
--

CREATE TABLE public.illnesses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    cie10_code character varying(10),
    diagnosed_date date,
    status public.illness_status DEFAULT 'ACTIVA'::public.illness_status NOT NULL,
    symptoms text,
    treatment text,
    prescribed_by character varying(255),
    notes text,
    is_chronic boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.illnesses OWNER TO vitalgo_user;

--
-- Name: TABLE illnesses; Type: COMMENT; Schema: public; Owner: vitalgo_user
--

COMMENT ON TABLE public.illnesses IS 'Patient medical conditions and illnesses with CIE-10 codes';


--
-- Name: paramedics; Type: TABLE; Schema: public; Owner: vitalgo_user
--

CREATE TABLE public.paramedics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    license_number character varying(50) NOT NULL,
    certification_level character varying(100),
    institution character varying(255),
    experience_years integer,
    specialties text[],
    is_verified boolean DEFAULT false,
    verification_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.paramedics OWNER TO vitalgo_user;

--
-- Name: TABLE paramedics; Type: COMMENT; Schema: public; Owner: vitalgo_user
--

COMMENT ON TABLE public.paramedics IS 'Paramedic credentials and professional information';


--
-- Name: patients; Type: TABLE; Schema: public; Owner: vitalgo_user
--

CREATE TABLE public.patients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    document_type public.document_type NOT NULL,
    document_number character varying(20) NOT NULL,
    birth_date date,
    gender public.gender_type,
    blood_type character varying(5),
    eps_id uuid,
    eps character varying(255),
    emergency_contact_name character varying(200),
    emergency_contact_phone character varying(20),
    address text,
    city character varying(100),
    allergies_notes text,
    medical_conditions text,
    medications text,
    medical_profile_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.patients OWNER TO vitalgo_user;

--
-- Name: TABLE patients; Type: COMMENT; Schema: public; Owner: vitalgo_user
--

COMMENT ON TABLE public.patients IS 'Patient-specific information and medical profile data';


--
-- Name: surgeries; Type: TABLE; Schema: public; Owner: vitalgo_user
--

CREATE TABLE public.surgeries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    surgery_date date,
    surgeon character varying(255),
    hospital character varying(255),
    description text,
    diagnosis character varying(500),
    anesthesia_type character varying(100),
    surgery_duration_minutes integer,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.surgeries OWNER TO vitalgo_user;

--
-- Name: TABLE surgeries; Type: COMMENT; Schema: public; Owner: vitalgo_user
--

COMMENT ON TABLE public.surgeries IS 'Patient surgical history and procedures';


--
-- Name: users; Type: TABLE; Schema: public; Owner: vitalgo_user
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20),
    role public.user_role DEFAULT 'patient'::public.user_role NOT NULL,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    email_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone
);


ALTER TABLE public.users OWNER TO vitalgo_user;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: vitalgo_user
--

COMMENT ON TABLE public.users IS 'Main users table containing authentication and basic user information';


--
-- Name: patient_emergency_info; Type: VIEW; Schema: public; Owner: vitalgo_user
--

CREATE VIEW public.patient_emergency_info AS
 SELECT p.id AS patient_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    p.document_type,
    p.document_number,
    p.birth_date,
    p.gender,
    p.blood_type,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    p.address,
    p.city,
    e.name AS eps_name,
    e.phone AS eps_phone,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('allergen', allergies.allergen, 'severity', allergies.severity, 'symptoms', allergies.symptoms, 'treatment', allergies.treatment)) AS jsonb_agg
           FROM public.allergies
          WHERE ((allergies.patient_id = p.id) AND (allergies.is_active = true) AND (allergies.deleted_at IS NULL))), '[]'::jsonb) AS allergies,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('name', illnesses.name, 'cie10_code', illnesses.cie10_code, 'status', illnesses.status, 'is_chronic', illnesses.is_chronic, 'treatment', illnesses.treatment)) AS jsonb_agg
           FROM public.illnesses
          WHERE ((illnesses.patient_id = p.id) AND (illnesses.is_active = true) AND (illnesses.deleted_at IS NULL))), '[]'::jsonb) AS illnesses,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('name', surgeries.name, 'surgery_date', surgeries.surgery_date, 'surgeon', surgeries.surgeon, 'hospital', surgeries.hospital, 'description', surgeries.description)) AS jsonb_agg
           FROM public.surgeries
          WHERE ((surgeries.patient_id = p.id) AND (surgeries.is_active = true) AND (surgeries.deleted_at IS NULL) AND (surgeries.surgery_date >= (CURRENT_DATE - '5 years'::interval)))), '[]'::jsonb) AS recent_surgeries
   FROM ((public.patients p
     JOIN public.users u ON ((p.user_id = u.id)))
     LEFT JOIN public.eps e ON ((p.eps_id = e.id)))
  WHERE (u.status = 'active'::public.user_status);


ALTER TABLE public.patient_emergency_info OWNER TO vitalgo_user;

--
-- Name: VIEW patient_emergency_info; Type: COMMENT; Schema: public; Owner: vitalgo_user
--

COMMENT ON VIEW public.patient_emergency_info IS 'Complete patient medical information for emergency access via QR codes';


--
-- Name: patient_qr_codes; Type: TABLE; Schema: public; Owner: vitalgo_user
--

CREATE TABLE public.patient_qr_codes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid NOT NULL,
    qr_token character varying(255) NOT NULL,
    qr_image_path character varying(500),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    access_count integer DEFAULT 0,
    last_accessed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.patient_qr_codes OWNER TO vitalgo_user;

--
-- Name: TABLE patient_qr_codes; Type: COMMENT; Schema: public; Owner: vitalgo_user
--

COMMENT ON TABLE public.patient_qr_codes IS 'QR codes generated for emergency medical access';


--
-- Name: qr_access_logs; Type: TABLE; Schema: public; Owner: vitalgo_user
--

CREATE TABLE public.qr_access_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    qr_code_id uuid NOT NULL,
    accessed_by_user_id uuid,
    access_type character varying(50),
    ip_address inet,
    user_agent text,
    success boolean DEFAULT false,
    failure_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.qr_access_logs OWNER TO vitalgo_user;

--
-- Name: TABLE qr_access_logs; Type: COMMENT; Schema: public; Owner: vitalgo_user
--

COMMENT ON TABLE public.qr_access_logs IS 'Audit log for QR code access attempts';


--
-- Data for Name: admin_actions; Type: TABLE DATA; Schema: public; Owner: vitalgo_user
--

COPY public.admin_actions (id, admin_id, action, target_type, target_id, details, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: allergies; Type: TABLE DATA; Schema: public; Owner: vitalgo_user
--

COPY public.allergies (id, patient_id, allergen, severity, symptoms, treatment, diagnosed_date, notes, is_active, created_at, updated_at, deleted_at) FROM stdin;
850e8400-e29b-41d4-a716-446655440001	650e8400-e29b-41d4-a716-446655440001	Penicilina	high	Rash cutáneo, dificultad respiratoria	Evitar penicilina, usar eritromicina como alternativa	2020-01-15	Reacción severa confirmada por alergólogo	t	2025-09-12 06:10:16.439445+00	2025-09-12 06:10:16.439445+00	\N
850e8400-e29b-41d4-a716-446655440002	650e8400-e29b-41d4-a716-446655440001	Mariscos	critical	Anafilaxia	EpiPen siempre disponible	2019-05-10	Porta EpiPen en todo momento	t	2025-09-12 06:10:16.439445+00	2025-09-12 06:10:16.439445+00	\N
850e8400-e29b-41d4-a716-446655440003	650e8400-e29b-41d4-a716-446655440002	Polen	low	Estornudos, congestión nasal	Antihistamínicos en temporada de polen	2021-03-20	Alergia estacional	t	2025-09-12 06:10:16.439445+00	2025-09-12 06:10:16.439445+00	\N
850e8400-e29b-41d4-a716-446655440004	650e8400-e29b-41d4-a716-446655440003	Ibuprofeno	medium	Dolor de estómago, náuseas	Evitar IBP, usar acetaminofén	2022-08-15	Intolerancia gástrica	t	2025-09-12 06:10:16.439445+00	2025-09-12 06:10:16.439445+00	\N
\.


--
-- Data for Name: eps; Type: TABLE DATA; Schema: public; Owner: vitalgo_user
--

COPY public.eps (id, name, code, phone, website, is_active, created_at) FROM stdin;
f958470c-d1e9-47ee-ab2f-3e65b3fdf06a	SURA	EPS001	+57-1-560-1234	https://www.sura.com	t	2025-09-12 04:18:31.23262+00
cd6b5b24-09d3-4e2d-a973-02aae43a514b	Nueva EPS	EPS002	+57-1-489-5000	https://www.nuevaeps.com.co	t	2025-09-12 04:18:31.23262+00
c049527e-ef2a-49e6-bf39-16daef60a634	Sanitas	EPS003	+57-1-560-9999	https://www.sanitas.co	t	2025-09-12 04:18:31.23262+00
4eb2000f-81ed-425e-a64c-f2be7641366f	Compensar	EPS004	+57-1-756-8000	https://www.compensar.com	t	2025-09-12 04:18:31.23262+00
d06db7ec-e2b6-41df-854b-7c9702c61dad	Famisanar	EPS005	+57-1-307-7777	https://www.famisanar.com.co	t	2025-09-12 04:18:31.23262+00
577e6de6-89ae-4122-aa44-6b1887fed0e2	Salud Total	EPS006	+57-1-744-4444	https://www.saludtotal.com.co	t	2025-09-12 04:18:31.23262+00
d1a6d0b8-4f42-4767-b4ba-9ea1d59eb999	Coomeva EPS	EPS007	+57-2-333-0000	https://www.coomeva.com.co	t	2025-09-12 04:18:31.23262+00
7043d530-611a-4daf-a5cb-77293eef3e7c	Cafesalud	EPS008	+57-1-756-5656	https://www.cafesalud.com.co	t	2025-09-12 04:18:31.23262+00
1b97bcbf-03b4-4069-a7fa-963f68e47440	Cruz Blanca	EPS009	+57-1-307-9999	https://www.cruzblancaeps.com	t	2025-09-12 04:18:31.23262+00
2413d01b-40e7-4488-aa96-1fafea0ea405	Medimás	EPS010	+57-1-307-8888	https://www.medimas.com.co	t	2025-09-12 04:18:31.23262+00
\.


--
-- Data for Name: illnesses; Type: TABLE DATA; Schema: public; Owner: vitalgo_user
--

COPY public.illnesses (id, patient_id, name, cie10_code, diagnosed_date, status, symptoms, treatment, prescribed_by, notes, is_chronic, is_active, created_at, updated_at, deleted_at) FROM stdin;
950e8400-e29b-41d4-a716-446655440001	650e8400-e29b-41d4-a716-446655440001	Hipertensión Arterial	I10	2018-04-12	CONTROLADA	Dolor de cabeza, mareos	Losartán 50mg diario	Dr. Ramírez - Cardiología	Control cada 6 meses	t	t	2025-09-12 06:10:16.441634+00	2025-09-12 06:10:16.441634+00	\N
950e8400-e29b-41d4-a716-446655440002	650e8400-e29b-41d4-a716-446655440002	Diabetes Tipo 2	E11	2019-11-08	CONTROLADA	Sed excesiva, fatiga	Metformina 500mg 2 veces al día	Dra. González - Endocrinología	Dieta controlada y ejercicio regular	t	t	2025-09-12 06:10:16.441634+00	2025-09-12 06:10:16.441634+00	\N
950e8400-e29b-41d4-a716-446655440003	650e8400-e29b-41d4-a716-446655440003	Asma Bronquial	J45	2015-02-18	CONTROLADA	Dificultad respiratoria, tos	Salbutamol inhalador de rescate	Dr. Herrera - Neumología	Evitar alérgenos ambientales	t	t	2025-09-12 06:10:16.441634+00	2025-09-12 06:10:16.441634+00	\N
950e8400-e29b-41d4-a716-446655440004	650e8400-e29b-41d4-a716-446655440004	Gastritis Crónica	K29.5	2020-07-25	CONTROLADA	Dolor epigástrico, acidez	Omeprazol 20mg en ayunas	Dr. Vega - Gastroenterología	Dieta blanda, evitar condimentos	t	t	2025-09-12 06:10:16.441634+00	2025-09-12 06:10:16.441634+00	\N
950e8400-e29b-41d4-a716-446655440005	650e8400-e29b-41d4-a716-446655440001	COVID-19	U07.1	2023-01-10	CURADA	Fiebre, tos, pérdida del olfato	Aislamiento, paracetamol, vitaminas	Dr. Silva - Medicina General	Recuperación completa sin secuelas	f	t	2025-09-12 06:10:16.441634+00	2025-09-12 07:25:53.277375+00	2025-09-12 07:25:53.277375+00
\.


--
-- Data for Name: paramedics; Type: TABLE DATA; Schema: public; Owner: vitalgo_user
--

COPY public.paramedics (id, user_id, license_number, certification_level, institution, experience_years, specialties, is_verified, verification_date, created_at, updated_at) FROM stdin;
750e8400-e29b-41d4-a716-446655440001	550e8400-e29b-41d4-a716-446655440005	MED-12345	Paramédico Avanzado	Universidad Nacional	8	{Emergencias,Cardiología,Trauma}	t	2025-09-12 06:10:16.437379+00	2025-09-12 06:10:16.437379+00	2025-09-12 06:10:16.437379+00
750e8400-e29b-41d4-a716-446655440002	550e8400-e29b-41d4-a716-446655440006	MED-67890	Técnico en Emergencias	Universidad Javeriana	5	{"Primeros Auxilios",Pediatría}	t	2025-09-12 06:10:16.437379+00	2025-09-12 06:10:16.437379+00	2025-09-12 06:10:16.437379+00
\.


--
-- Data for Name: patient_qr_codes; Type: TABLE DATA; Schema: public; Owner: vitalgo_user
--

COPY public.patient_qr_codes (id, patient_id, qr_token, qr_image_path, expires_at, is_active, access_count, last_accessed_at, created_at, updated_at) FROM stdin;
b50e8400-e29b-41d4-a716-446655440002	650e8400-e29b-41d4-a716-446655440002	QR_CARLOS_LOPEZ_002	\N	2026-09-12 06:10:16.446135+00	t	0	\N	2025-09-12 06:10:16.446135+00	2025-09-12 06:10:16.446135+00
b50e8400-e29b-41d4-a716-446655440003	650e8400-e29b-41d4-a716-446655440003	QR_ANA_RODRIGUEZ_003	\N	2026-09-12 06:10:16.446135+00	t	0	\N	2025-09-12 06:10:16.446135+00	2025-09-12 06:10:16.446135+00
b50e8400-e29b-41d4-a716-446655440004	650e8400-e29b-41d4-a716-446655440004	QR_LUIS_MARTINEZ_004	\N	2026-09-12 06:10:16.446135+00	t	0	\N	2025-09-12 06:10:16.446135+00	2025-09-12 06:10:16.446135+00
b50e8400-e29b-41d4-a716-446655440001	650e8400-e29b-41d4-a716-446655440001	QR_MARIA_GARCIA_001	\N	2026-09-12 06:10:16.446135+00	f	0	\N	2025-09-12 06:10:16.446135+00	2025-09-12 15:24:22.716343+00
6b3b5ed7-bd50-4cb7-88ce-f2ed41a0246f	650e8400-e29b-41d4-a716-446655440001	WRXL8wjjsbN8XPe2pUxMtRNlRLWmZi-acAU3xXRZf4E	\N	2026-09-12 15:24:22.5955+00	f	0	\N	2025-09-12 15:24:22.716343+00	2025-09-12 15:24:49.696586+00
54ee3205-5534-4eb6-bd16-84e63ef6a156	650e8400-e29b-41d4-a716-446655440001	sbmW5l7XZKaldJ93ujLjCO-nTirYbFVjo-aHlg8_U6I	\N	2026-09-12 15:24:49.679565+00	t	0	\N	2025-09-12 15:24:49.696586+00	2025-09-12 15:24:49.696586+00
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: vitalgo_user
--

COPY public.patients (id, user_id, document_type, document_number, birth_date, gender, blood_type, eps_id, eps, emergency_contact_name, emergency_contact_phone, address, city, allergies_notes, medical_conditions, medications, medical_profile_completed, created_at, updated_at) FROM stdin;
650e8400-e29b-41d4-a716-446655440001	550e8400-e29b-41d4-a716-446655440001	CC	12345678	1985-03-15	F	O+	f958470c-d1e9-47ee-ab2f-3e65b3fdf06a	\N	Juan García	+573001111111	Calle 123 #45-67	Bogotá	\N	\N	\N	t	2025-09-12 06:10:16.43323+00	2025-09-12 06:10:16.43323+00
650e8400-e29b-41d4-a716-446655440002	550e8400-e29b-41d4-a716-446655440002	CC	87654321	1978-08-22	M	A+	cd6b5b24-09d3-4e2d-a973-02aae43a514b	\N	Elena López	+573002222222	Carrera 88 #12-34	Medellín	\N	\N	\N	t	2025-09-12 06:10:16.43323+00	2025-09-12 06:10:16.43323+00
650e8400-e29b-41d4-a716-446655440003	550e8400-e29b-41d4-a716-446655440003	CC	11223344	1992-12-05	F	B+	c049527e-ef2a-49e6-bf39-16daef60a634	\N	Miguel Rodríguez	+573003333333	Avenida 6 #78-90	Cali	\N	\N	\N	t	2025-09-12 06:10:16.43323+00	2025-09-12 06:10:16.43323+00
650e8400-e29b-41d4-a716-446655440004	550e8400-e29b-41d4-a716-446655440004	CC	55667788	1990-06-10	M	AB-	4eb2000f-81ed-425e-a64c-f2be7641366f	\N	Carmen Martínez	+573004444444	Transversal 15 #23-45	Barranquilla	\N	\N	\N	t	2025-09-12 06:10:16.43323+00	2025-09-12 06:10:16.43323+00
\.


--
-- Data for Name: qr_access_logs; Type: TABLE DATA; Schema: public; Owner: vitalgo_user
--

COPY public.qr_access_logs (id, qr_code_id, accessed_by_user_id, access_type, ip_address, user_agent, success, failure_reason, created_at) FROM stdin;
c50e8400-e29b-41d4-a716-446655440001	b50e8400-e29b-41d4-a716-446655440001	550e8400-e29b-41d4-a716-446655440005	emergency_access	192.168.1.100	Mozilla/5.0 Emergency Access	t	\N	2025-09-10 06:10:16.448251+00
c50e8400-e29b-41d4-a716-446655440002	b50e8400-e29b-41d4-a716-446655440002	550e8400-e29b-41d4-a716-446655440006	medical_review	192.168.1.101	Mozilla/5.0 Medical App	t	\N	2025-09-11 06:10:16.448251+00
\.


--
-- Data for Name: surgeries; Type: TABLE DATA; Schema: public; Owner: vitalgo_user
--

COPY public.surgeries (id, patient_id, name, surgery_date, surgeon, hospital, description, diagnosis, anesthesia_type, surgery_duration_minutes, notes, is_active, created_at, updated_at, deleted_at) FROM stdin;
a50e8400-e29b-41d4-a716-446655440001	650e8400-e29b-41d4-a716-446655440002	Apendicectomía	2020-09-15	Dr. Mendoza	Hospital San Ignacio	Extracción de apéndice inflamado	Apendicitis aguda	General	45	Cirugía sin complicaciones, recuperación normal	t	2025-09-12 06:10:16.44389+00	2025-09-12 06:10:16.44389+00	\N
a50e8400-e29b-41d4-a716-446655440002	650e8400-e29b-41d4-a716-446655440003	Colecistectomía Laparoscópica	2021-06-22	Dra. Ruiz	Clínica Shaio	Extracción de vesícula biliar por laparoscopia	Colelitiasis sintomática	General	90	Técnica mínimamente invasiva, alta al día siguiente	t	2025-09-12 06:10:16.44389+00	2025-09-12 06:10:16.44389+00	\N
a50e8400-e29b-41d4-a716-446655440003	650e8400-e29b-41d4-a716-446655440004	Reparación de Hernia Inguinal	2022-03-08	Dr. Castillo	Hospital Militar	Corrección de hernia inguinal derecha	Hernia inguinal indirecta	Raquídea	60	Colocación de malla, evolución satisfactoria	t	2025-09-12 06:10:16.44389+00	2025-09-12 06:10:16.44389+00	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: vitalgo_user
--

COPY public.users (id, email, password_hash, first_name, last_name, phone, role, status, email_verified, created_at, updated_at, last_login) FROM stdin;
88e557fd-6704-40d1-928f-3be21afc1896	admin@vitalgo.app	$2b$12$kH7/iZxdkJ3.XsxI6yQBr.vFnxBmGQB4.z8OY7Qx0YPmVGHwFDqIq	VitalGo	Administrator	\N	admin	active	t	2025-09-12 04:18:31.234832+00	2025-09-12 04:18:31.234832+00	\N
550e8400-e29b-41d4-a716-446655440001	maria.garcia@email.com	ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae	María	García	+573001234567	patient	active	t	2025-09-12 06:10:16.431157+00	2025-09-12 06:12:47.670265+00	\N
550e8400-e29b-41d4-a716-446655440002	carlos.lopez@email.com	ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae	Carlos	López	+573009876543	patient	active	t	2025-09-12 06:10:16.431157+00	2025-09-12 06:12:47.670265+00	\N
550e8400-e29b-41d4-a716-446655440003	ana.rodriguez@email.com	ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae	Ana	Rodríguez	+573005555555	patient	active	t	2025-09-12 06:10:16.431157+00	2025-09-12 06:12:47.670265+00	\N
550e8400-e29b-41d4-a716-446655440004	luis.martinez@email.com	ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae	Luis	Martínez	+573007777777	patient	active	t	2025-09-12 06:10:16.431157+00	2025-09-12 06:12:47.670265+00	\N
550e8400-e29b-41d4-a716-446655440005	dr.fernandez@email.com	ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae	Roberto	Fernández	+573002222222	paramedic	active	t	2025-09-12 06:10:16.431157+00	2025-09-12 06:12:47.670265+00	\N
550e8400-e29b-41d4-a716-446655440006	dra.morales@email.com	ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae	Patricia	Morales	+573003333333	paramedic	active	t	2025-09-12 06:10:16.431157+00	2025-09-12 06:12:47.670265+00	\N
\.


--
-- Name: admin_actions admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_pkey PRIMARY KEY (id);


--
-- Name: allergies allergies_pkey; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.allergies
    ADD CONSTRAINT allergies_pkey PRIMARY KEY (id);


--
-- Name: eps eps_code_key; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.eps
    ADD CONSTRAINT eps_code_key UNIQUE (code);


--
-- Name: eps eps_name_key; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.eps
    ADD CONSTRAINT eps_name_key UNIQUE (name);


--
-- Name: eps eps_pkey; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.eps
    ADD CONSTRAINT eps_pkey PRIMARY KEY (id);


--
-- Name: illnesses illnesses_pkey; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.illnesses
    ADD CONSTRAINT illnesses_pkey PRIMARY KEY (id);


--
-- Name: paramedics paramedics_license_number_key; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.paramedics
    ADD CONSTRAINT paramedics_license_number_key UNIQUE (license_number);


--
-- Name: paramedics paramedics_pkey; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.paramedics
    ADD CONSTRAINT paramedics_pkey PRIMARY KEY (id);


--
-- Name: paramedics paramedics_user_id_key; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.paramedics
    ADD CONSTRAINT paramedics_user_id_key UNIQUE (user_id);


--
-- Name: patient_qr_codes patient_qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.patient_qr_codes
    ADD CONSTRAINT patient_qr_codes_pkey PRIMARY KEY (id);


--
-- Name: patient_qr_codes patient_qr_codes_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.patient_qr_codes
    ADD CONSTRAINT patient_qr_codes_qr_token_key UNIQUE (qr_token);


--
-- Name: patients patients_document_type_document_number_key; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_document_type_document_number_key UNIQUE (document_type, document_number);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: patients patients_user_id_key; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_key UNIQUE (user_id);


--
-- Name: qr_access_logs qr_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.qr_access_logs
    ADD CONSTRAINT qr_access_logs_pkey PRIMARY KEY (id);


--
-- Name: surgeries surgeries_pkey; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.surgeries
    ADD CONSTRAINT surgeries_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_admin_actions_admin; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_admin_actions_admin ON public.admin_actions USING btree (admin_id);


--
-- Name: idx_admin_actions_created; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_admin_actions_created ON public.admin_actions USING btree (created_at);


--
-- Name: idx_allergies_active; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_allergies_active ON public.allergies USING btree (patient_id, is_active, deleted_at);


--
-- Name: idx_allergies_patient_id; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_allergies_patient_id ON public.allergies USING btree (patient_id);


--
-- Name: idx_illnesses_active; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_illnesses_active ON public.illnesses USING btree (patient_id, is_active, deleted_at);


--
-- Name: idx_illnesses_patient_id; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_illnesses_patient_id ON public.illnesses USING btree (patient_id);


--
-- Name: idx_paramedics_license; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_paramedics_license ON public.paramedics USING btree (license_number);


--
-- Name: idx_paramedics_user_id; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_paramedics_user_id ON public.paramedics USING btree (user_id);


--
-- Name: idx_patients_document; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_patients_document ON public.patients USING btree (document_type, document_number);


--
-- Name: idx_patients_user_id; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_patients_user_id ON public.patients USING btree (user_id);


--
-- Name: idx_qr_access_logs_created; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_qr_access_logs_created ON public.qr_access_logs USING btree (created_at);


--
-- Name: idx_qr_access_logs_qr_code; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_qr_access_logs_qr_code ON public.qr_access_logs USING btree (qr_code_id);


--
-- Name: idx_qr_codes_patient_active; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_qr_codes_patient_active ON public.patient_qr_codes USING btree (patient_id, is_active);


--
-- Name: idx_qr_codes_token; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_qr_codes_token ON public.patient_qr_codes USING btree (qr_token);


--
-- Name: idx_surgeries_active; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_surgeries_active ON public.surgeries USING btree (patient_id, is_active, deleted_at);


--
-- Name: idx_surgeries_patient_id; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_surgeries_patient_id ON public.surgeries USING btree (patient_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: vitalgo_user
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: allergies update_allergies_updated_at; Type: TRIGGER; Schema: public; Owner: vitalgo_user
--

CREATE TRIGGER update_allergies_updated_at BEFORE UPDATE ON public.allergies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: illnesses update_illnesses_updated_at; Type: TRIGGER; Schema: public; Owner: vitalgo_user
--

CREATE TRIGGER update_illnesses_updated_at BEFORE UPDATE ON public.illnesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: paramedics update_paramedics_updated_at; Type: TRIGGER; Schema: public; Owner: vitalgo_user
--

CREATE TRIGGER update_paramedics_updated_at BEFORE UPDATE ON public.paramedics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patients update_patients_updated_at; Type: TRIGGER; Schema: public; Owner: vitalgo_user
--

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patient_qr_codes update_qr_codes_updated_at; Type: TRIGGER; Schema: public; Owner: vitalgo_user
--

CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON public.patient_qr_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: surgeries update_surgeries_updated_at; Type: TRIGGER; Schema: public; Owner: vitalgo_user
--

CREATE TRIGGER update_surgeries_updated_at BEFORE UPDATE ON public.surgeries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: vitalgo_user
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_actions admin_actions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: allergies allergies_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.allergies
    ADD CONSTRAINT allergies_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: illnesses illnesses_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.illnesses
    ADD CONSTRAINT illnesses_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: paramedics paramedics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.paramedics
    ADD CONSTRAINT paramedics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: patient_qr_codes patient_qr_codes_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.patient_qr_codes
    ADD CONSTRAINT patient_qr_codes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patients patients_eps_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_eps_id_fkey FOREIGN KEY (eps_id) REFERENCES public.eps(id);


--
-- Name: patients patients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: qr_access_logs qr_access_logs_accessed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.qr_access_logs
    ADD CONSTRAINT qr_access_logs_accessed_by_user_id_fkey FOREIGN KEY (accessed_by_user_id) REFERENCES public.users(id);


--
-- Name: qr_access_logs qr_access_logs_qr_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.qr_access_logs
    ADD CONSTRAINT qr_access_logs_qr_code_id_fkey FOREIGN KEY (qr_code_id) REFERENCES public.patient_qr_codes(id) ON DELETE CASCADE;


--
-- Name: surgeries surgeries_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitalgo_user
--

ALTER TABLE ONLY public.surgeries
    ADD CONSTRAINT surgeries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict GgPA9JKXaSHp43r0Yh1JgGJsFpvw7BT5Qy8j0qyOFaVIWqxAjMdhgiLfmhsyz7U

