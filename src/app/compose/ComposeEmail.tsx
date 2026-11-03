import { useLocation, useRoute } from 'preact-iso';

import { useCrypt } from '../useCrypt.ts';
import { loadEmail } from './utils.ts';
import { Suspense, use } from 'preact/compat';


function ComposeEmail() {
	const { id } = useRoute().params as { id?: string };
	const { route } = useLocation();
	const { credId, key } = useCrypt();

	if (!credId) return route('/register');
	const cryptKey = use(key);
	if (!cryptKey) return route('/register');

	const defaultValues = id == null ? {} : use(loadEmail(id, cryptKey)) ?? {};

	return (
		<form className="container stack" name="compose-email">
			<label>
				To:
				<input
					defaultValue={defaultValues.to}
					name="to"
					type="text"
				/>
			</label>

			<label>
				CC:
				<input
					defaultValue={defaultValues.cc}
					name="cc"
					type="text"
				/>
			</label>

			<label>
				BCC:
				<input
					defaultValue={defaultValues.bcc}
					name="bcc"
					type="text"
				/>
			</label>

			<label>
				Subject:
				<input
					defaultValue={defaultValues.subject}
					name="subject"
					type="text"
				/>
			</label>

			<label>
				Body:
				<textarea
					defaultValue={defaultValues.body}
					name="body"
				></textarea>
			</label>

			<div className="split">
				<button className="danger" type="reset">Delete draft</button>

				<button className="primary" type="submit">Save draft</button>
			</div>
		</form>
	);
}

export default function ComposeEmailPage(props) {
	return (
		<Suspense fallback={<p>Loading …</p>}>
			<ComposeEmail {...props} />
		</Suspense>
	)
}
