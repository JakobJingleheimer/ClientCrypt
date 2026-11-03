import { useLocation } from 'preact-iso';

import { useCrypt } from '../useCrypt.ts';
import { handleRegister, type SubmitRegistrationHandler } from './utils.ts';


export default function Register() {
	const crypt = useCrypt();
	const { route } = useLocation();

	const handleSubmit: SubmitRegistrationHandler = async (event) => {
		await handleRegister(event, crypt);
		route('/emails');
	};

	return (
		<form
			className="container stack"
			name="register"
			onSubmit={handleSubmit}
		>
			<label>
				Name:
				<input
					name="displayName"
					placeholder="Alex Smith"
					type="text"
				/>
			</label>

			<label>
				Email:
				<input
					name="email"
					placeholder="alex@example.com"
					type="email"
				/>
			</label>

			<button
				className="primary"
				type="submit"
			>Submit</button>
		</form>
	);
}
