--
-- PostgreSQL database dump
--

\restrict S1piZWx5XLscAi4nvHXdUqvfoxXfDsUK1pwW5tpW10zVZHH4u3BexpqTj6yQHko

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    problem_id integer NOT NULL,
    content text NOT NULL,
    author text NOT NULL,
    author_avatar text,
    likes integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: community_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_groups (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    member_count integer DEFAULT 0 NOT NULL,
    problem_count integer DEFAULT 0 NOT NULL,
    category text NOT NULL,
    image_url text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: community_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.community_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: community_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.community_groups_id_seq OWNED BY public.community_groups.id;


--
-- Name: community_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_members (
    id integer NOT NULL,
    community_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: community_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.community_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: community_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.community_members_id_seq OWNED BY public.community_members.id;


--
-- Name: community_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_messages (
    id integer NOT NULL,
    user_id integer NOT NULL,
    user_name text NOT NULL,
    user_avatar text,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    community_id integer NOT NULL
);


--
-- Name: community_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.community_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: community_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.community_messages_id_seq OWNED BY public.community_messages.id;


--
-- Name: community_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_tasks (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    assigned_to text,
    assigned_to_avatar text,
    problem_id integer,
    problem_title text,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: community_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.community_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: community_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.community_tasks_id_seq OWNED BY public.community_tasks.id;


--
-- Name: contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contributions (
    id integer NOT NULL,
    problem_id integer NOT NULL,
    user_id integer NOT NULL,
    amount real NOT NULL,
    anonymous boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    payment_method text DEFAULT 'bank'::text NOT NULL,
    payment_method_other text,
    transaction_id text DEFAULT ''::text NOT NULL,
    proof_image_url text,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by_id integer,
    reviewed_at timestamp without time zone,
    rejection_reason text
);


--
-- Name: contributions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contributions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contributions_id_seq OWNED BY public.contributions.id;


--
-- Name: ngo_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ngo_profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    organization text NOT NULL,
    contact_number text NOT NULL,
    plan_description text NOT NULL,
    estimated_cost real NOT NULL,
    timeline_value integer NOT NULL,
    timeline_unit text NOT NULL,
    required_resources text NOT NULL,
    previous_work_url text,
    certificate_url text,
    agreed_to_provide_updates boolean DEFAULT false NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by_id integer,
    reviewed_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ngo_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ngo_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ngo_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ngo_profiles_id_seq OWNED BY public.ngo_profiles.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    problem_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: problem_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.problem_members (
    id integer NOT NULL,
    problem_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: problem_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.problem_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: problem_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.problem_members_id_seq OWNED BY public.problem_members.id;


--
-- Name: problems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.problems (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    location text NOT NULL,
    status text DEFAULT 'reported'::text NOT NULL,
    image_url text,
    funding_goal real DEFAULT 0 NOT NULL,
    funding_raised real DEFAULT 0 NOT NULL,
    progress_percent real DEFAULT 0 NOT NULL,
    joined_count integer DEFAULT 0 NOT NULL,
    urgency text DEFAULT 'medium'::text NOT NULL,
    verified_count integer DEFAULT 0 NOT NULL,
    posted_by_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: problems_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.problems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: problems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.problems_id_seq OWNED BY public.problems.id;


--
-- Name: update_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.update_verifications (
    id integer NOT NULL,
    update_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: update_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.update_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: update_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.update_verifications_id_seq OWNED BY public.update_verifications.id;


--
-- Name: updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.updates (
    id integer NOT NULL,
    problem_id integer NOT NULL,
    content text NOT NULL,
    author text NOT NULL,
    author_avatar text,
    image_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    verified_count integer DEFAULT 0 NOT NULL
);


--
-- Name: updates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.updates_id_seq OWNED BY public.updates.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    bio text,
    avatar_url text,
    location text,
    reputation_score integer DEFAULT 0 NOT NULL,
    problems_created integer DEFAULT 0 NOT NULL,
    problems_solved integer DEFAULT 0 NOT NULL,
    total_contributed real DEFAULT 0 NOT NULL,
    joined_at timestamp without time zone DEFAULT now() NOT NULL,
    password_hash text,
    role text DEFAULT 'user'::text NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: community_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_groups ALTER COLUMN id SET DEFAULT nextval('public.community_groups_id_seq'::regclass);


--
-- Name: community_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members ALTER COLUMN id SET DEFAULT nextval('public.community_members_id_seq'::regclass);


--
-- Name: community_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_messages ALTER COLUMN id SET DEFAULT nextval('public.community_messages_id_seq'::regclass);


--
-- Name: community_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_tasks ALTER COLUMN id SET DEFAULT nextval('public.community_tasks_id_seq'::regclass);


--
-- Name: contributions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions ALTER COLUMN id SET DEFAULT nextval('public.contributions_id_seq'::regclass);


--
-- Name: ngo_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ngo_profiles ALTER COLUMN id SET DEFAULT nextval('public.ngo_profiles_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: problem_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problem_members ALTER COLUMN id SET DEFAULT nextval('public.problem_members_id_seq'::regclass);


--
-- Name: problems id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problems ALTER COLUMN id SET DEFAULT nextval('public.problems_id_seq'::regclass);


--
-- Name: update_verifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.update_verifications ALTER COLUMN id SET DEFAULT nextval('public.update_verifications_id_seq'::regclass);


--
-- Name: updates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.updates ALTER COLUMN id SET DEFAULT nextval('public.updates_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comments (id, problem_id, content, author, author_avatar, likes, created_at) FROM stdin;
1	1	This stretch is terrifying at night. My cousin had an accident here last month. We need to fix this urgently!	Vijay T.	\N	12	2026-04-02 11:57:14.418385
2	1	I work near Hebbal. The situation is exactly as described. I've contributed Rs. 2000. Come on neighbors, let's do this!	Sunita R.	\N	8	2026-04-06 11:57:14.418385
3	1	Great initiative! I've shared this on the Hebbal Residents WhatsApp group. Should get more people joining.	Kiran M.	\N	5	2026-04-11 11:57:14.418385
4	3	Our kids have been getting sick. Doctors are seeing more gastro cases. This MUST be fixed immediately.	Dr. Ramamurthy	\N	24	2026-03-29 11:57:14.418385
5	3	Thank you for taking this up. We were suffering in silence. Glad someone is doing something!	Lakshmi P.	\N	19	2026-04-01 11:57:14.418385
\.


--
-- Data for Name: community_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.community_groups (id, name, description, member_count, problem_count, category, image_url, active, created_at) FROM stdin;
1	Bangalore Roads Watch	Monitoring and reporting road infrastructure issues across Bangalore. We track potholes, broken signals, and flooding.	342	18	Roads	\N	t	2026-04-20 11:57:17.998045
4	Education First Karnataka	Improving government school infrastructure and access across Karnataka villages and cities.	89	4	Education	\N	t	2026-04-20 11:57:17.998045
2	Green Bangalore Initiative	Working to protect Bangalore's lakes, trees, and green spaces. Community-led environmental action.	219	12	Environment	\N	t	2026-04-20 11:57:17.998045
3	Safe Water Alliance	Ensuring clean and safe drinking water for all neighborhoods. Sampling, reporting, and advocacy.	156	7	Water	\N	t	2026-04-20 11:57:17.998045
\.


--
-- Data for Name: community_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.community_members (id, community_id, user_id, joined_at) FROM stdin;
3	2	1	2026-04-20 15:04:17.734235
\.


--
-- Data for Name: community_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.community_messages (id, user_id, user_name, user_avatar, message, created_at, community_id) FROM stdin;
3	1	Priya Sharma	https://api.dicebear.com/7.x/avataaars/svg?seed=priya	Hello Green Bangalore from Priya!	2026-04-20 15:02:58.867611	2
4	1	Priya Sharma	https://api.dicebear.com/7.x/avataaars/svg?seed=priya	E2E priya in green	2026-04-20 15:04:34.734682	2
5	2	Rahul Mehta	https://api.dicebear.com/7.x/avataaars/svg?seed=rahul	Hello priya from rahul	2026-04-20 15:06:36.160932	2
\.


--
-- Data for Name: community_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.community_tasks (id, title, description, assigned_to, assigned_to_avatar, problem_id, problem_title, status, due_date, created_at) FROM stdin;
1	Photograph all non-functional streetlights	Document each broken light with GPS coordinates for BBMP complaint file.	Vijay T.	\N	1	Broken Streetlights on NH-44	done	2024-03-15	2026-04-20 11:57:21.70748
2	Follow up with BBMP Commissioner office	Escalate unresolved complaint to Commissioner. Draft escalation letter.	Priya Sharma	\N	1	Broken Streetlights on NH-44	in_progress	2024-04-01	2026-04-20 11:57:21.70748
3	Collect water samples from 10 households	Systematic sampling from different street taps for lab analysis.	Ananya Krishnan	\N	3	No Clean Drinking Water	done	2024-03-10	2026-04-20 11:57:21.70748
4	Connect with local MLA for fast-track approval	Schedule meeting with MLA office to push corporation work order.	Rahul Mehta	\N	2	Open Sewage Drain	pending	2024-04-10	2026-04-20 11:57:21.70748
5	Organize community clean-up drive at Ulsoor Lake	Coordinate 50 volunteers for one-day lake cleanup. Arrange equipment.	Sunita R.	\N	5	Garbage Dump Near Lake	in_progress	2024-04-05	2026-04-20 11:57:21.70748
\.


--
-- Data for Name: contributions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contributions (id, problem_id, user_id, amount, anonymous, created_at, payment_method, payment_method_other, transaction_id, proof_image_url, status, reviewed_by_id, reviewed_at, rejection_reason) FROM stdin;
1	1	1	5000	f	2026-04-05 11:57:10.641589	bank	\N		\N	pending	\N	\N	\N
2	1	2	10000	f	2026-04-08 11:57:10.641589	bank	\N		\N	pending	\N	\N	\N
3	1	3	7500	f	2026-04-12 11:57:10.641589	bank	\N		\N	pending	\N	\N	\N
4	3	1	25000	f	2026-03-31 11:57:10.641589	bank	\N		\N	pending	\N	\N	\N
5	3	2	15000	f	2026-04-02 11:57:10.641589	bank	\N		\N	pending	\N	\N	\N
6	5	3	20000	f	2026-04-10 11:57:10.641589	bank	\N		\N	pending	\N	\N	\N
7	6	1	15000	f	2026-03-26 11:57:10.641589	bank	\N		\N	pending	\N	\N	\N
8	1	1	500	f	2026-04-20 16:14:14.672979	jazzcash	\N	TXN999	\N	approved	5	2026-04-20 16:14:14.898	\N
9	1	1	250	f	2026-04-20 16:19:29.971053	easypaisa	\N	TXN_IDEMP_TEST	\N	approved	5	2026-04-20 16:19:30.133	\N
\.


--
-- Data for Name: ngo_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ngo_profiles (id, user_id, organization, contact_number, plan_description, estimated_cost, timeline_value, timeline_unit, required_resources, previous_work_url, certificate_url, agreed_to_provide_updates, status, reviewed_by_id, reviewed_at, rejection_reason, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, message, type, read, problem_id, created_at) FROM stdin;
1	1	Your problem "Broken Streetlights on NH-44" has been verified by 23 community members.	success	f	1	2026-04-18 11:57:25.546289
2	1	New contribution of Rs. 10,000 received for "Broken Streetlights on NH-44". Total now at Rs. 52,000!	success	f	1	2026-04-17 11:57:25.546289
3	1	Update posted on "No Clean Drinking Water" — 79% funded! You're almost there.	info	t	3	2026-04-15 11:57:25.546289
4	1	"Pothole Cluster on Main Road" has been marked as COMPLETED!	success	t	6	2026-04-13 11:57:25.546289
\.


--
-- Data for Name: problem_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.problem_members (id, problem_id, user_id, joined_at) FROM stdin;
\.


--
-- Data for Name: problems; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.problems (id, title, description, category, location, status, image_url, funding_goal, funding_raised, progress_percent, joined_count, urgency, verified_count, posted_by_id, created_at) FROM stdin;
1	Broken Streetlights on NH-44 Causing Night Accidents	Over 12 streetlights on the 2km stretch of NH-44 near Hebbal flyover have been non-functional for 3 months. Two accidents have already occurred. BBMP has not responded to 6 complaints.	Safety	Hebbal, Bangalore	funding_started	https://images.unsplash.com/photo-1517490232338-06b912a786b5?w=800&q=80	85000	52750	62.058823	47	critical	23	1	2026-04-20 11:56:29.125532
7	Pothole blocking school access	A large pothole has formed near the school gate and is damaging vehicles and making the road unsafe for children and parents every day.	Roads	MG Road, Bangalore, Karnataka	reported	https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80	5000	0	0	0	medium	0	1	2026-04-20 14:37:28.663788
2	Open Sewage Drain Flooding Residential Area	The main sewage drain on 5th Cross has been overflowing for 6 weeks, flooding 3 streets and causing severe health hazards. Children cannot walk to school safely.	Sanitation	Koramangala, Bangalore	community_joined	https://images.unsplash.com/photo-1581578017093-cd30fce4eeb7?w=800&q=80	120000	18000	15	89	high	41	2	2026-04-20 11:56:29.125532
3	No Clean Drinking Water for 200 Families	The water supply to our colony has been contaminated with mud for 2 months. Corporation water is undrinkable. 200 families spend Rs. 3000/month on bottled water.	Water	Whitefield, Bangalore	in_progress	https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80	250000	198000	79.2	156	critical	67	3	2026-04-20 11:56:29.125532
4	Primary School Has No Toilets for Girl Students	Government Primary School #47 serves 340 students but has no functioning girls toilet. Girls are forced to go home or use open fields. This is affecting enrollment.	Education	Electronic City, Bangalore	reported	https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80	75000	8500	11.3	28	high	15	1	2026-04-20 11:56:29.125532
5	Garbage Dump Near Lake Destroying Ecosystem	Illegal garbage dumping near Ulsoor Lake has been ongoing for 8 months. The lake water is now turning black. Migratory birds have stopped coming.	Environment	Ulsoor, Bangalore	funding_started	https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80	180000	95000	52.8	73	high	38	2	2026-04-20 11:56:29.125532
6	Pothole Cluster on Main Road Damaged 50+ Vehicles	A 500-meter stretch on Outer Ring Road has 30+ potholes. In the last month alone, 50 vehicles reported tyre damage and 3 minor accidents. RTO complaints ignored.	Roads	Marathahalli, Bangalore	completed	https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80	45000	45000	100	124	medium	89	3	2026-04-20 11:56:29.125532
\.


--
-- Data for Name: update_verifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.update_verifications (id, update_id, user_id, created_at) FROM stdin;
1	1	1	2026-04-20 12:21:01.196107
2	2	1	2026-04-20 12:24:14.695381
\.


--
-- Data for Name: updates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.updates (id, problem_id, content, author, author_avatar, image_url, created_at, verified_count) FROM stdin;
3	1	Funding milestone reached at 50%! Work order has been issued. Contractor will start next Monday.	Priya Sharma	https://api.dicebear.com/7.x/avataaars/svg?seed=priya	\N	2026-04-17 11:57:06.918609	0
4	3	Water samples sent to government lab for testing. Results expected in 5 days.	Ananya Krishnan	https://api.dicebear.com/7.x/avataaars/svg?seed=ananya	\N	2026-04-05 11:57:06.918609	0
5	3	Lab confirmed contamination. Now working with water board to identify source. Pipeline inspection underway.	Ananya Krishnan	https://api.dicebear.com/7.x/avataaars/svg?seed=ananya	\N	2026-04-13 11:57:06.918609	0
6	6	Road patching work completed! All 30 potholes filled. Road reopened to traffic. Thank you community!	Rahul Mehta	https://api.dicebear.com/7.x/avataaars/svg?seed=rahul	\N	2026-04-18 11:57:06.918609	0
1	1	Reported issue to BBMP via online portal and registered complaint #BMP2024-7823. Awaiting response.	Priya Sharma	https://api.dicebear.com/7.x/avataaars/svg?seed=priya	\N	2026-03-31 11:57:06.918609	1
2	1	BBMP acknowledged complaint after our community follow-up. Engineer visit scheduled for next week.	Priya Sharma	https://api.dicebear.com/7.x/avataaars/svg?seed=priya	\N	2026-04-10 11:57:06.918609	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, bio, avatar_url, location, reputation_score, problems_created, problems_solved, total_contributed, joined_at, password_hash, role) FROM stdin;
2	Rahul Mehta	rahul@example.com	Software engineer by day, community organizer by evening. Believe in technology for social good.	https://api.dicebear.com/7.x/avataaars/svg?seed=rahul	Mumbai, Maharashtra	218	1	0	5000	2026-04-20 11:56:03.906537	$2b$10$UO2KH/66rDL68dK3Q0SfYOvJqJpPvwb1Uclsd.MMZ5uGQ78LE1tK6	user
3	Ananya Krishnan	ananya@example.com	Environmental activist and civil engineer. Want cleaner cities for our children.	https://api.dicebear.com/7.x/avataaars/svg?seed=ananya	Chennai, Tamil Nadu	156	2	1	8200	2026-04-20 11:56:03.906537	$2b$10$UO2KH/66rDL68dK3Q0SfYOvJqJpPvwb1Uclsd.MMZ5uGQ78LE1tK6	user
4	Test User	testuser@example.com	\N	https://api.dicebear.com/7.x/avataaars/svg?seed=testuser%40example.com	\N	0	0	0	0	2026-04-20 12:21:01.335413	$2b$10$X95VSpBpCULtx46HTP.oWOMfPYbO9engN9avmc3kQT589LK6c63MG	ngo
5	Admin	admin@example.com	\N	https://api.dicebear.com/7.x/avataaars/svg?seed=admin	\N	0	0	0	0	2026-04-20 16:07:59.54556	$2b$10$5xK8/auAK9QlruMD.BG/vuD./8qzku12JXPsJJTKRtcVQx.2a5NSS	admin
1	Priya Sharma	priya@example.com	Passionate about civic engagement and community development. 5 years of local activism in Bangalore.	https://api.dicebear.com/7.x/avataaars/svg?seed=priya	Bangalore, Karnataka	342	3	1	13250	2026-04-20 11:56:03.906537	$2b$10$UO2KH/66rDL68dK3Q0SfYOvJqJpPvwb1Uclsd.MMZ5uGQ78LE1tK6	user
\.


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comments_id_seq', 5, true);


--
-- Name: community_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.community_groups_id_seq', 4, true);


--
-- Name: community_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.community_members_id_seq', 19, true);


--
-- Name: community_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.community_messages_id_seq', 5, true);


--
-- Name: community_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.community_tasks_id_seq', 5, true);


--
-- Name: contributions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contributions_id_seq', 9, true);


--
-- Name: ngo_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ngo_profiles_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 4, true);


--
-- Name: problem_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.problem_members_id_seq', 1, true);


--
-- Name: problems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.problems_id_seq', 7, true);


--
-- Name: update_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.update_verifications_id_seq', 2, true);


--
-- Name: updates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.updates_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: community_groups community_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_groups
    ADD CONSTRAINT community_groups_pkey PRIMARY KEY (id);


--
-- Name: community_members community_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_pkey PRIMARY KEY (id);


--
-- Name: community_messages community_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_messages
    ADD CONSTRAINT community_messages_pkey PRIMARY KEY (id);


--
-- Name: community_tasks community_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_tasks
    ADD CONSTRAINT community_tasks_pkey PRIMARY KEY (id);


--
-- Name: contributions contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_pkey PRIMARY KEY (id);


--
-- Name: ngo_profiles ngo_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ngo_profiles
    ADD CONSTRAINT ngo_profiles_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: problem_members problem_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problem_members
    ADD CONSTRAINT problem_members_pkey PRIMARY KEY (id);


--
-- Name: problems problems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problems
    ADD CONSTRAINT problems_pkey PRIMARY KEY (id);


--
-- Name: update_verifications update_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.update_verifications
    ADD CONSTRAINT update_verifications_pkey PRIMARY KEY (id);


--
-- Name: update_verifications update_verifications_update_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.update_verifications
    ADD CONSTRAINT update_verifications_update_id_user_id_unique UNIQUE (update_id, user_id);


--
-- Name: updates updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.updates
    ADD CONSTRAINT updates_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: community_members_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX community_members_uniq ON public.community_members USING btree (community_id, user_id);


--
-- Name: ngo_profiles_user_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ngo_profiles_user_uniq ON public.ngo_profiles USING btree (user_id);


--
-- Name: problem_members_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX problem_members_uniq ON public.problem_members USING btree (problem_id, user_id);


--
-- Name: comments comments_problem_id_problems_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_problem_id_problems_id_fk FOREIGN KEY (problem_id) REFERENCES public.problems(id);


--
-- Name: contributions contributions_problem_id_problems_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_problem_id_problems_id_fk FOREIGN KEY (problem_id) REFERENCES public.problems(id);


--
-- Name: contributions contributions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: problems problems_posted_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problems
    ADD CONSTRAINT problems_posted_by_id_users_id_fk FOREIGN KEY (posted_by_id) REFERENCES public.users(id);


--
-- Name: update_verifications update_verifications_update_id_updates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.update_verifications
    ADD CONSTRAINT update_verifications_update_id_updates_id_fk FOREIGN KEY (update_id) REFERENCES public.updates(id);


--
-- Name: update_verifications update_verifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.update_verifications
    ADD CONSTRAINT update_verifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: updates updates_problem_id_problems_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.updates
    ADD CONSTRAINT updates_problem_id_problems_id_fk FOREIGN KEY (problem_id) REFERENCES public.problems(id);


--
-- PostgreSQL database dump complete
--

\unrestrict S1piZWx5XLscAi4nvHXdUqvfoxXfDsUK1pwW5tpW10zVZHH4u3BexpqTj6yQHko

