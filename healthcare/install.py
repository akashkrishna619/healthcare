import click

from healthcare.setup import setup_healthcare as setup


def after_install():
	try:
		print("Setting up Frappe Health...")
		setup()

		click.secho("Thank you for installing Frappe Health!", fg="green")

	except Exception as e:
		BUG_REPORT_URL = "https://github.com/frappe/healthcare/issues/new"
		click.secho(
			"Installation for Frappe Health app failed due to an error."
			" Please try re-installing the app or"
			f" report the issue on {BUG_REPORT_URL} if not resolved.",
			fg="bright_red",
		)
		raise e
