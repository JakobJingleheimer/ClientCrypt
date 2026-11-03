import { ErrorBoundary, lazy, LocationProvider, Route, Router } from 'preact-iso';

const Register = lazy(() => import('./register/Register.tsx'));
const ComposeEmail = lazy(() => import('./compose/ComposeEmail.tsx'));


export default function App() {
	return (
		<LocationProvider>
			<ErrorBoundary>
				<Router>
					<Route component={Register} default />
					<Route component={Register} path="/register" />
					<Route component={ComposeEmail} path="/emails/:id?" />
				</Router>
			</ErrorBoundary>
		</LocationProvider>
	);
}
